import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, AlertTriangle, AlertCircle, Info, Clock, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../../utils/helpers.js';
import api from '../../services/api.js';

const severityIcons = { critical: AlertCircle, warning: AlertTriangle, info: Info };

const pageKeyMap = {
  '/': 'dashboard',
  '/inventory': 'inventory',
  '/products': 'products',
  '/suppliers': 'suppliers',
  '/orders': 'orders',
  '/alerts': 'alerts',
  '/reports': 'reports',
  '/settings': 'settings',
  '/profile': 'profile',
};

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const pageKey = pageKeyMap[location.pathname] || 'dashboard';
  const pageTitle = t(`pages.${pageKey}.title`);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  const now = new Date();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const timeStr = now.toLocaleString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/alerts?isRead=false');
        setAlerts(data.data.alerts || []);
        setUnreadCount(data.data.unreadCount || 0);
      } catch (e) { /* silent */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* silent */ }
  };

  const handleLogout = () => {
    setShowAvatarMenu(false);
    logout();
  };

  const handleProfile = () => {
    setShowAvatarMenu(false);
    navigate('/profile');
  };

  const avatarUrl = user?.avatar;
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-icon-btn menu-toggle" onClick={onMenuToggle} id="menu-toggle-btn">
          <Menu size={20} />
        </button>
        <div>
          <h2>{pageTitle}</h2>
          <p>{timeStr}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search" id="topbar-search">
          <Search size={16} />
          <input type="text" placeholder={t('topbar.search')} />
        </div>

        {/* Notifications Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            id="notifications-btn"
            onClick={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-dropdown-header">
                <span className="notifications-dropdown-title">{t('topbar.notifications')}</span>
                {unreadCount > 0 && <span className="alerts-count">{unreadCount}</span>}
              </div>

              <div className="notifications-dropdown-body">
                {alerts.length === 0 ? (
                  <div className="notifications-empty">
                    <Bell size={24} style={{ color: 'var(--text-muted)' }} />
                    <p>{t('topbar.noNewNotifications')}</p>
                  </div>
                ) : (
                  alerts.slice(0, 6).map((alert) => {
                    const Icon = severityIcons[alert.severity] || Info;
                    return (
                      <div
                        key={alert.id}
                        className="notification-item"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <div className={`alert-icon ${alert.severity}`}>
                          <Icon size={14} />
                        </div>
                        <div className="notification-item-content">
                          <p className="notification-item-msg">{alert.message}</p>
                          <span className="notification-item-time">
                            <Clock size={10} /> {timeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="notifications-dropdown-footer">
                <button onClick={() => { setShowNotifications(false); navigate('/alerts'); }}>
                  {t('topbar.viewAllAlerts')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Dropdown */}
        <div ref={avatarRef} className="avatar-dropdown-wrapper">
          <button
            className="avatar-trigger"
            onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
            id="avatar-menu-btn"
          >
            <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="topbar-avatar-img" />
              ) : (
                initials
              )}
            </div>
            <div className="avatar-trigger-info">
              <span className="avatar-trigger-name">{user?.name || 'User'}</span>
              <span className="avatar-trigger-role">{user?.role || 'manager'}</span>
            </div>
            <ChevronDown size={14} className={`avatar-chevron ${showAvatarMenu ? 'rotate' : ''}`} />
          </button>

          {showAvatarMenu && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-header">
                <div className="avatar-dropdown-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="topbar-avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="avatar-dropdown-name">{user?.name || 'User'}</div>
                  <div className="avatar-dropdown-email">{user?.email || ''}</div>
                </div>
              </div>

              <div className="avatar-dropdown-divider" />

              <button className="avatar-dropdown-item" onClick={handleProfile} id="profile-btn">
                <User size={15} />
                <span>{t('topbar.myProfile')}</span>
              </button>

              <div className="avatar-dropdown-divider" />

              <button className="avatar-dropdown-item avatar-dropdown-logout" onClick={handleLogout} id="logout-btn">
                <LogOut size={15} />
                <span>{t('topbar.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
