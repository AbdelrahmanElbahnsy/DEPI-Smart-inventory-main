import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import { User, Lock, Bell as BellIcon, Palette, Users, Plus, Edit2, Trash2, Shield, Phone } from 'lucide-react';
import { formatDate } from '../utils/helpers.js';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import ConfirmModal from '../components/layout/ConfirmModal.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

/* ─── Role badge styling ─── */
const roleBadgeStyles = {
  owner:    { className: 'badge-danger',  label: 'Owner' },
  manager:  { className: 'badge-info',    label: 'Manager' },
  security: { className: 'badge-warning', label: 'Security' },
  staff:    { className: 'badge-success', label: 'Staff' },
};

export default function Settings() {
  const { user, isOwner, isManager, canManageUsers } = useAuth();
  const { settings, updateSetting, updateNotification } = useSettings();
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Profile state
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileMsg, setProfileMsg] = useState('');

  // Password state
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passMsg, setPassMsg] = useState('');

  // User management state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' });
  const [userMsg, setUserMsg] = useState('');

  useEffect(() => {
    document.body.style.overflow = showUserModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showUserModal]);

  // Fetch users (Owner or Manager)
  useEffect(() => {
    if (canManageUsers) {
      api.get('/users').then(res => setUsers(res.data.data.users || [])).catch(() => {});
    }
  }, [canManageUsers]);

  // Save profile
  const saveProfile = async () => {
    try {
      await api.put('/users/profile', profile);
      setProfileMsg('✅ ' + t('settings.profileUpdated'));
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e) {
      setProfileMsg('❌ ' + (e.response?.data?.message || 'Error'));
    }
  };

  // Change password
  const changePassword = async () => {
    if (password.newPassword !== password.confirm) {
      setPassMsg('❌ ' + t('settings.passwordsDoNotMatch'));
      return;
    }
    if (password.newPassword.length < 6) {
      setPassMsg('❌ ' + t('settings.passwordMinLength'));
      return;
    }
    try {
      await api.put('/users/password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      setPassMsg('✅ ' + t('settings.passwordChanged'));
      setPassword({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPassMsg(''), 3000);
    } catch (e) {
      setPassMsg('❌ ' + (e.response?.data?.message || 'Error'));
    }
  };

  // ── Determine which roles the current user can assign ──
  const getAssignableRoles = () => {
    if (isOwner) return ['owner', 'manager', 'security', 'staff'];
    if (isManager) return ['security', 'staff'];
    return [];
  };

  // User CRUD
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserMsg('');
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          phone: userForm.phone,
        });
      } else {
        if (!userForm.password || userForm.password.length < 6) {
          setUserMsg('❌ ' + t('settings.passwordMinLength'));
          return;
        }
        await api.post('/users', userForm);
      }
      setShowUserModal(false);
      setEditUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'staff', phone: '' });
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
      toast.success(editUser ? 'User updated successfully' : 'User created successfully');
    } catch (e) {
      setUserMsg('❌ ' + (e.response?.data?.message || 'Error'));
    }
  };

  const openEditUser = (u) => {
    // Manager cannot edit owners or other managers
    if (isManager && (u.role === 'owner' || u.role === 'manager')) {
      toast.error('You do not have permission to edit this user');
      return;
    }
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
    setUserMsg('');
    setShowUserModal(true);
  };

  const deleteUserHandler = async (id, targetRole) => {
    // Only Owner can delete
    if (!isOwner) {
      toast.error('Only Owners can delete users');
      return;
    }
    const ok = await confirm({
      title: t('settings.deleteUser'),
      message: 'This user will lose all access to the system. This action cannot be undone.',
      confirmText: 'Delete User',
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error deleting user');
    }
  };

  const notifItems = [
    { key: 'lowStock', labelKey: 'settings.lowStockAlerts' },
    { key: 'outOfStock', labelKey: 'settings.outOfStockAlerts' },
    { key: 'overstock', labelKey: 'settings.overstockAlerts' },
    { key: 'orderUpdates', labelKey: 'settings.orderUpdates' },
    { key: 'reportGeneration', labelKey: 'settings.reportGeneration' },
  ];

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings.pageTitle')}</h1>
          <p className="page-subtitle">{t('settings.pageSubtitle')}</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* PROFILE */}
        <div className="settings-card">
          <h3><User size={16} style={{ display: 'inline', marginInlineEnd: 8, verticalAlign: 'middle' }} />{t('settings.profileInfo')}</h3>
          <div className="form-group">
            <label className="form-label">{t('settings.fullName')}</label>
            <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.email')}</label>
            <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.role')}</label>
            <input className="form-input" value={user?.role || 'staff'} disabled style={{ opacity: 0.5, textTransform: 'capitalize' }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {t('settings.roleChangeNote')}
            </p>
          </div>
          {profileMsg && <p style={{ fontSize: 12, marginBottom: 8, color: profileMsg.startsWith('✅') ? 'var(--status-success)' : 'var(--status-danger)' }}>{profileMsg}</p>}
          <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={saveProfile}>{t('settings.saveChanges')}</button>
        </div>

        {/* PASSWORD */}
        <div className="settings-card">
          <h3><Lock size={16} style={{ display: 'inline', marginInlineEnd: 8, verticalAlign: 'middle' }} />{t('settings.changePassword')}</h3>
          <div className="form-group">
            <label className="form-label">{t('settings.currentPassword')}</label>
            <input className="form-input" type="password" value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.newPassword')}</label>
            <input className="form-input" type="password" value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.confirmPassword')}</label>
            <input className="form-input" type="password" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} />
          </div>
          {passMsg && <p style={{ fontSize: 12, marginBottom: 8, color: passMsg.startsWith('✅') ? 'var(--status-success)' : 'var(--status-danger)' }}>{passMsg}</p>}
          <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={changePassword}>{t('settings.updatePassword')}</button>
        </div>

        {/* NOTIFICATIONS — WORKING TOGGLES */}
        <div className="settings-card">
          <h3><BellIcon size={16} style={{ display: 'inline', marginInlineEnd: 8, verticalAlign: 'middle' }} />{t('settings.notifications')}</h3>
          {notifItems.map(({ key, labelKey }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13 }}>{t(labelKey)}</span>
              <button
                onClick={() => updateNotification(key, !settings.notifications[key])}
                style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  background: settings.notifications[key] ? 'var(--accent-primary)' : 'var(--bg-input)',
                  border: `1px solid ${settings.notifications[key] ? 'var(--accent-primary)' : 'var(--border-input)'}`,
                  transition: 'all 0.25s ease', cursor: 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 2, left: settings.notifications[key] ? 22 : 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'white', transition: 'left 0.25s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>{t('settings.settingsSavedAuto')}</p>
        </div>

        {/* APPEARANCE — WORKING SELECTS */}
        <div className="settings-card">
          <h3><Palette size={16} style={{ display: 'inline', marginInlineEnd: 8, verticalAlign: 'middle' }} />{t('settings.appearance')}</h3>
          <div className="form-group">
            <label className="form-label">{t('settings.theme')}</label>
            <select className="form-select" value={settings.theme} onChange={e => updateSetting('theme', e.target.value)}>
              <option value="dark">{t('settings.darkMode')}</option>
              <option value="light">{t('settings.lightMode')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.language')}</label>
            <select className="form-select" value={settings.language} onChange={e => updateSetting('language', e.target.value)}>
              <option value="en">{t('settings.english')}</option>
              <option value="ar">{t('settings.arabic')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.dateFormat')}</label>
            <select className="form-select" value={settings.dateFormat} onChange={e => updateSetting('dateFormat', e.target.value)}>
              <option value="mdy">MM/DD/YYYY</option>
              <option value="dmy">DD/MM/YYYY</option>
              <option value="ymd">YYYY-MM-DD</option>
            </select>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{t('settings.settingsSavedAuto')}</p>
        </div>
      </div>

      {/* USER MANAGEMENT — Owner & Manager */}
      {canManageUsers && (
        <div style={{ marginTop: 24 }}>
          <div className="page-header">
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                <Shield size={18} style={{ display: 'inline', marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
                {t('settings.userManagement')}
              </h2>
              <p className="page-subtitle">
                {isOwner
                  ? t('settings.userManagementSub')
                  : t('settings.userManagementSubManager')}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => {
              setEditUser(null);
              setUserForm({ name: '', email: '', password: '', role: isOwner ? 'staff' : 'staff', phone: '' });
              setUserMsg('');
              setShowUserModal(true);
            }}>
              <Plus size={16} /> {t('settings.addUser')}
            </button>
          </div>

          <div className="data-table-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('settings.user')}</th>
                    <th>{t('settings.email')}</th>
                    <th>{t('settings.role')}</th>
                    <th>{t('settings.phone')}</th>
                    <th>{t('settings.created')}</th>
                    <th>{t('settings.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const badge = roleBadgeStyles[u.role] || roleBadgeStyles.staff;
                    const canEdit = isOwner || (isManager && u.role !== 'owner' && u.role !== 'manager');
                    const canDelete = isOwner && u.id !== user?.id;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {u.avatar ? (
                                <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                u.name?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>
                            <span className="badge-dot" />{badge.label}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {canEdit && (
                              <button className="btn btn-icon btn-secondary" onClick={() => openEditUser(u)}>
                                <Edit2 size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn btn-icon btn-danger" onClick={() => deleteUserHandler(u.id, u.role)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT USER MODAL */}
      {showUserModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editUser ? t('settings.editUser') : t('settings.addNewUser')}</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="modal-body">
                {userMsg && <div className="auth-error">{userMsg}</div>}
                <div className="form-group">
                  <label className="form-label">{t('settings.fullName')}</label>
                  <input className="form-input" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('settings.email')}</label>
                  <input className="form-input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">{t('settings.newPassword')}</label>
                    <input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required placeholder={t('settings.passwordPlaceholder')} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{t('settings.phone')}</label>
                  <input className="form-input" type="tel" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="+20-010-XXXX-XXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('settings.role')}</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                    {getAssignableRoles().map(r => (
                      <option key={r} value={r}>{t(`settings.role_${r}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>{t('settings.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editUser ? t('settings.updateUser') : t('settings.createUser')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
    </AnimatedPage>
  );
}
