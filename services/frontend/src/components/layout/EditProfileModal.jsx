import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Lock, Save, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../services/api.js';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.05 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 350, mass: 0.6 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 16,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = data.data.user;
      updateUser(updatedUser);
      addToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      addToast('Please fill in both password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/users/password', { currentPassword, newPassword });
      addToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  const initials = name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="modal edit-profile-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Avatar Upload */}
                <div className="edit-profile-avatar-row">
                  <div
                    className="edit-profile-avatar edit-profile-avatar-clickable"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to change photo"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="edit-profile-avatar-image" />
                    ) : (
                      initials
                    )}
                    <div className="edit-profile-avatar-overlay">
                      <Camera size={16} />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <div className="edit-profile-avatar-info">
                    <span className="edit-profile-avatar-name">{name || 'User'}</span>
                    <span className="edit-profile-avatar-role">{user?.role || 'manager'}</span>
                    <button
                      type="button"
                      className="edit-profile-change-photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* Name Field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">
                    <User size={12} style={{ display: 'inline', marginRight: 6 }} />
                    Full Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                  />
                </div>

                {/* Email Field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-email">
                    <Mail size={12} style={{ display: 'inline', marginRight: 6 }} />
                    Email Address
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Section */}
                <div className="edit-profile-pw-section">
                  <div className="edit-profile-pw-header">
                    <Lock size={13} />
                    <span>Change Password</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-current-pw">Current Password</label>
                    <input
                      id="edit-current-pw"
                      type="password"
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-new-pw">New Password</label>
                    <input
                      id="edit-new-pw"
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleChangePassword}
                    disabled={changingPw}
                    style={{ marginTop: 4 }}
                  >
                    <Lock size={13} />
                    {changingPw ? 'Changing...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
