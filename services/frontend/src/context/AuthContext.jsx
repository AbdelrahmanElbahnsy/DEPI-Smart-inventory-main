import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

// Refresh the access token 1 minute before it expires
const REFRESH_MARGIN_MS = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const refreshTimerRef = useRef(null);

  // ── Schedule a silent refresh before the access token expires ──
  const scheduleRefresh = useCallback((expiresInSec) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = Math.max((expiresInSec * 1000) - REFRESH_MARGIN_MS, 5000);
    refreshTimerRef.current = setTimeout(async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) return;

      try {
        const { data } = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
        const { token: newToken, refreshToken: newRefreshToken, expiresIn } = data.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setToken(newToken);
        // Schedule the next refresh
        scheduleRefresh(expiresIn);
      } catch {
        // If refresh fails, the interceptor will handle logout
        console.warn('⚠️ Proactive token refresh failed');
      }
    }, delay);
  }, []);

  // ── Validate token on mount ──
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setInitializing(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        const validUser = data.data.user;
        setUser(validUser);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(validUser));
        // Start the refresh timer (assume ~14 min remaining for safety)
        scheduleRefresh(840);
      } catch (err) {
        console.warn('⚠️ Token validation failed, logging out');
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setInitializing(false);
      }
    };

    validateToken();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user: userData, token: newToken, refreshToken: newRefreshToken, expiresIn } = data.data;
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      scheduleRefresh(expiresIn);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      const { user: userData, token: newToken, refreshToken: newRefreshToken, expiresIn } = data.data;
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      scheduleRefresh(expiresIn);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  // ── Update user in state + localStorage (used by profile edit) ──
  const updateUser = useCallback((updatedUserData) => {
    const merged = { ...user, ...updatedUserData };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  }, [user]);

  /* ─── RBAC Role Helpers ─── */
  const isOwner   = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const isSecurity = user?.role === 'security';
  const isStaff   = user?.role === 'staff';

  // Can manage users (Owner = full CRUD, Manager = create Staff/Security)
  const canManageUsers = isOwner || isManager;

  // Backward compat: isAdmin maps to isOwner
  const isAdmin = isOwner;

  return (
    <AuthContext.Provider value={{
      user, token, loading, initializing,
      login, register, logout, updateUser,
      isAdmin, isOwner, isManager, isSecurity, isStaff,
      canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
