import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Bell, BarChart3, Settings, LogOut, X, Boxes
} from 'lucide-react';

const navItems = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/inventory', labelKey: 'sidebar.inventory', icon: Package },
  { path: '/products', labelKey: 'sidebar.products', icon: Boxes },
  { path: '/suppliers', labelKey: 'sidebar.suppliers', icon: Users },
  { path: '/orders', labelKey: 'sidebar.orders', icon: ShoppingCart },
  { path: '/alerts', labelKey: 'sidebar.alerts', icon: Bell, hasBadge: true },
  { path: '/reports', labelKey: 'sidebar.reports', icon: BarChart3 },
  { path: '/settings', labelKey: 'sidebar.settings', icon: Settings },
];

/* ─── Overlay backdrop (mobile only) ─── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ─── Drawer slide-in / slide-out (mobile) ─── */
const drawerVariants = {
  hidden: (isRtl) => ({
    x: isRtl ? '100%' : '-100%',
    boxShadow: '0 0 0 rgba(0,0,0,0)',
  }),
  visible: {
    x: 0,
    boxShadow: '8px 0 40px rgba(0,0,0,0.35)',
    transition: { type: 'spring', damping: 28, stiffness: 320, mass: 0.7 },
  },
  exit: (isRtl) => ({
    x: isRtl ? '100%' : '-100%',
    boxShadow: '0 0 0 rgba(0,0,0,0)',
    transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.28 },
  }),
};

/* ─── Staggered nav-link children ─── */
const navContainerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', damping: 22, stiffness: 200 },
  },
};

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { data: alertData } = useFetch('/alerts?isRead=false');
  const unreadCount = alertData?.unreadCount || 0;
  const isRtl = document.documentElement.dir === 'rtl';

  const handleLogout = () => {
    if (isMobile) onClose();
    logout();
  };

  const avatarUrl = user?.avatar;

  /* ────── Sidebar inner content (shared between mobile & desktop) ────── */
  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="drawer-header">
        <div className="drawer-brand">
          <div className="drawer-brand-icon">SI</div>
          <div className="drawer-brand-text">
            <h1>{t('sidebar.brand')}</h1>
            <span>{t('sidebar.brandSub')}</span>
          </div>
        </div>
        {isMobile && (
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <motion.nav
        className="drawer-nav"
        variants={navContainerVariants}
        initial="hidden"
        animate="visible"
        key="sidebar-nav"
      >
        <div className="drawer-section-title">{t('sidebar.mainMenu')}</div>
        {navItems.map((item) => (
          <motion.div key={item.path} variants={navItemVariants}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
              id={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <item.icon size={18} />
              <span className="drawer-link-text">{t(item.labelKey)}</span>
              {item.hasBadge && unreadCount > 0 && (
                <span className="drawer-badge">{unreadCount}</span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      {/* Footer with user info + logout */}
      <div className="drawer-footer">
        <div className="drawer-user">
          <div className="drawer-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="drawer-avatar-img" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="drawer-user-info">
            <div className="drawer-user-name">{user?.name || 'User'}</div>
            <div className="drawer-user-role">{user?.role || 'manager'}</div>
          </div>
          <button
            className="drawer-logout-btn"
            onClick={handleLogout}
            title={t('sidebar.logout')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  /* ────── Desktop: persistent FIXED sidebar — always visible ────── */
  if (!isMobile) {
    if (!isOpen) return null;
    return (
      <aside
        className="sidebar-push sidebar-push-open"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100vh',
          width: '280px',
          zIndex: 1000,
          overflowY: 'auto',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {sidebarContent}
      </aside>
    );
  }

  /* ────── Mobile: overlay drawer with animation ────── */
  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="drawer-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <AnimatePresence custom={isRtl}>
        {isOpen && (
          <motion.aside
            className="drawer-panel"
            custom={isRtl}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
