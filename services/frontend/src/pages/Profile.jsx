import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Shield, ArrowLeft, Edit3, Calendar,
  Briefcase, Star, ChevronRight, LogOut, Camera, Phone
} from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';
import EditProfileModal from '../components/layout/EditProfileModal.jsx';

/* ─── Role color mapping for all 4 roles ─── */
const roleStyles = {
  owner:    { bg: 'rgba(239, 68, 68, 0.15)',  text: '#ef4444', label: 'Owner' },
  manager:  { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', label: 'Manager' },
  security: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Security' },
  staff:    { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'Staff' },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('') || 'U';

  const avatarUrl = user?.avatar;
  const currentRole = roleStyles[user?.role] || roleStyles.staff;

  const handleLogout = () => {
    logout();
  };

  return (
    <AnimatedPage>
    <div className="profile-page">
      {/* Back button */}
      <button
        className="profile-back-btn"
        onClick={() => navigate('/')}
        id="profile-back-btn"
      >
        <ArrowLeft size={18} />
        <span>{t('profile.backToDashboard')}</span>
      </button>

      {/* Profile Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          {/* Large Avatar */}
          <div className="profile-avatar-large">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="profile-avatar-large-img" />
            ) : (
              <span>{initials}</span>
            )}
            <div className="profile-avatar-ring" />
          </div>

          {/* Name and role */}
          <div className="profile-hero-info">
            <h1 className="profile-name">{user?.name || 'User'}</h1>
            <div className="profile-role-badge" style={{ background: currentRole.bg, color: currentRole.text }}>
              <Shield size={13} />
              <span>{currentRole.label}</span>
            </div>
          </div>

          {/* Edit button — opens modal */}
          <button
            className="btn btn-primary profile-edit-btn"
            onClick={() => setEditModalOpen(true)}
            id="profile-edit-btn"
          >
            <Edit3 size={15} />
            <span>{t('profile.editProfile')}</span>
          </button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="profile-cards-grid">
        {/* Personal Information */}
        <div className="profile-info-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <User size={18} />
            </div>
            <h3>{t('profile.personalInfo')}</h3>
          </div>
          <div className="profile-card-body">
            <div className="profile-info-row">
              <div className="profile-info-label">
                <User size={14} />
                <span>{t('profile.fullName')}</span>
              </div>
              <div className="profile-info-value">{user?.name || '—'}</div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Mail size={14} />
                <span>{t('profile.email')}</span>
              </div>
              <div className="profile-info-value">{user?.email || '—'}</div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Phone size={14} />
                <span>{t('profile.phone')}</span>
              </div>
              <div className="profile-info-value">{user?.phone || '—'}</div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Shield size={14} />
                <span>{t('profile.role')}</span>
              </div>
              <div className="profile-info-value" style={{ textTransform: 'capitalize' }}>
                {user?.role || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="profile-info-card">
          <div className="profile-card-header">
            <div className="profile-card-icon accent">
              <Briefcase size={18} />
            </div>
            <h3>{t('profile.accountDetails')}</h3>
          </div>
          <div className="profile-card-body">
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Star size={14} />
                <span>{t('profile.accountType')}</span>
              </div>
              <div className="profile-info-value">{t('profile.premium')}</div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Calendar size={14} />
                <span>{t('profile.memberSince')}</span>
              </div>
              <div className="profile-info-value">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">
                <Shield size={14} />
                <span>{t('profile.status')}</span>
              </div>
              <div className="profile-info-value">
                <span className="profile-status-active">
                  <span className="profile-status-dot" />
                  {t('profile.active')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile-actions-card">
        <h3>{t('profile.quickActions')}</h3>
        <div className="profile-actions-grid">
          <button className="profile-action-tile" onClick={() => setEditModalOpen(true)} id="action-edit-profile">
            <div className="profile-action-icon edit">
              <Edit3 size={20} />
            </div>
            <div>
              <span className="profile-action-title">{t('profile.editProfile')}</span>
              <span className="profile-action-desc">{t('profile.editProfileDesc')}</span>
            </div>
            <ChevronRight size={16} className="profile-action-chevron" />
          </button>

          <button className="profile-action-tile" onClick={() => navigate('/settings')} id="action-change-password">
            <div className="profile-action-icon security">
              <Shield size={20} />
            </div>
            <div>
              <span className="profile-action-title">{t('profile.security')}</span>
              <span className="profile-action-desc">{t('profile.securityDesc')}</span>
            </div>
            <ChevronRight size={16} className="profile-action-chevron" />
          </button>

          <button className="profile-action-tile profile-action-logout" onClick={handleLogout} id="action-logout">
            <div className="profile-action-icon logout">
              <LogOut size={20} />
            </div>
            <div>
              <span className="profile-action-title">Logout</span>
              <span className="profile-action-desc">Sign out of your account</span>
            </div>
            <ChevronRight size={16} className="profile-action-chevron" />
          </button>
        </div>
      </div>
    </div>

    {/* Edit Profile Modal */}
    <EditProfileModal
      isOpen={editModalOpen}
      onClose={() => setEditModalOpen(false)}
    />
    </AnimatedPage>
  );
}
