import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { getStatusBadge, formatDate } from '../utils/helpers.js';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import ConfirmModal from '../components/layout/ConfirmModal.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Suppliers() {
  const { isOwner, isManager } = useAuth();
  const canManage = isOwner || isManager;
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', status: 'active' });

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showModal]);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.data.suppliers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) await api.put(`/suppliers/${editItem.id}`, form);
      else await api.post('/suppliers', form);
      setShowModal(false); setEditItem(null);
      setForm({ name: '', email: '', phone: '', company: '', address: '', status: 'active' });
      fetchSuppliers();
      toast.success(editItem ? 'Supplier updated' : 'Supplier created');
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving supplier'); }
  };

  const handleEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', company: s.company || '', address: s.address || '', status: s.status });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Supplier',
      message: 'This will permanently remove this supplier and break any product associations. This action cannot be undone.',
      confirmText: 'Delete Supplier',
    });
    if (!ok) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Supplier deleted'); fetchSuppliers(); } catch (e) { toast.error('Error deleting supplier'); }
  };

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} supplier relationships</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', email: '', phone: '', company: '', address: '', status: 'active' }); setShowModal(true); }} id="add-supplier-btn">
            <Plus size={16} /> Add Supplier
          </button>
        )}
      </div>

      <div className="data-table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Supplier</th><th>Company</th><th>Contact</th><th>Products</th><th>Status</th><th>Added</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan="7"><div className="skeleton skeleton-text" /></td></tr>
              )) : suppliers.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No suppliers</td></tr>
              ) : suppliers.map(s => {
                const status = getStatusBadge(s.status);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: 12, background: s.status === 'active' ? 'var(--accent-gradient)' : 'var(--bg-input)' }}>
                          {s.name?.charAt(0)}
                        </div>
                        <div className="table-product-name">{s.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.company || '—'}</td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {s.email}</div>}
                        {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Phone size={11} /> {s.phone}</div>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.productCount || 0}</td>
                    <td><span className={`badge ${status.className}`}><span className="badge-dot" />{status.label}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(s.createdAt)}</td>
                    <td>
                      {canManage && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(s)}><Edit2 size={14} /></button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Address</label><textarea className="form-input" rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
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
