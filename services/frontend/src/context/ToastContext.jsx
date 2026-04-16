import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    const toast = { id, message, type, exiting: false, createdAt: Date.now() };
    
    setToasts(prev => {
      const updated = [...prev, toast];
      // Max 4 toasts visible
      if (updated.length > 4) {
        const oldest = updated[0];
        removeToast(oldest.id);
      }
      return updated;
    });

    if (duration > 0) {
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur || 5000), [addToast]);
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container" role="alert" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          const progress = toast.type === 'error' ? 5000 : 4000;
          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
            >
              <div className={`toast-icon toast-icon-${toast.type}`}>
                <Icon size={16} />
              </div>
              <div className="toast-body">
                <span className="toast-message">{toast.message}</span>
              </div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
              <div className="toast-progress">
                <div
                  className={`toast-progress-bar toast-progress-${toast.type}`}
                  style={{ animationDuration: `${progress}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
