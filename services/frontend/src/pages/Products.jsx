import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ImageIcon, Upload } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/helpers.js';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import ConfirmModal from '../components/layout/ConfirmModal.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

/* ─── Smart fallback for product images ─── */
function ProductImage({ src, name, size = 38 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const initials = name
      ? name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')
      : '?';
    const colors = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
    ];
    const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
    return (
      <div
        className="product-img-fallback"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${colors[colorIdx]}, ${colors[(colorIdx + 3) % colors.length]})`,
        }}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="table-product-img"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

export default function Products() {
  const { isOwner, isManager, isSecurity } = useAuth();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const canCreate = !isSecurity; // Owner, Manager, Staff
  const canDelete = isOwner || isManager; // Only Owner & Manager
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', price: '', quantity: '', minStock: '10', maxStock: '1000', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showModal]);

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/products', { params });
      setProducts(data.data.products || []);
      setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get('/products/categories').then(res => setCategories(res.data.data.categories || [])).catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ name: '', sku: '', category: '', price: '', quantity: '', minStock: '10', maxStock: '1000', description: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('sku', form.sku);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('quantity', form.quantity);
      formData.append('minStock', form.minStock);
      formData.append('maxStock', form.maxStock);
      formData.append('description', form.description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(editProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowModal(false);
      setEditProduct(null);
      resetForm();
      fetchProducts(pagination.page);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name, sku: product.sku, category: product.category || '',
      price: product.price, quantity: product.quantity, minStock: product.minStock,
      maxStock: product.maxStock, description: product.description || '',
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Product',
      message: 'This will permanently remove this product from your inventory. This action cannot be undone.',
      confirmText: 'Delete Product',
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts(pagination.page);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error deleting product');
    }
  };

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{pagination.total} products in your inventory</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => { setEditProduct(null); resetForm(); setShowModal(true); }} id="add-product-btn">
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-search">
            <Search size={15} />
            <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} id="product-search" />
          </div>
          <div className="data-table-actions">
            <select className="data-table-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} id="category-filter">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="data-table-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="status-filter">
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Price</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan="8"><div className="skeleton skeleton-text" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</td></tr>
              ) : (
                products.map((product) => {
                  const status = getStatusBadge(product.status);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="table-product">
                          <ProductImage src={product.image} name={product.name} />
                          <div className="table-product-name">{product.name}</div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{product.sku}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{product.category}</td>
                      <td style={{ fontWeight: 600 }}>{product.quantity}</td>
                      <td><span className={`badge ${status.className}`}><span className="badge-dot" />{status.label}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(product.lastUpdated)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {canCreate && (
                            <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(product)}><Edit2 size={14} /></button>
                          )}
                          {canDelete && (
                            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="table-pagination-info">Showing {products.length} of {pagination.total}</span>
          <div className="table-pagination-btns">
            <button disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={p === pagination.page ? 'active' : ''} onClick={() => fetchProducts(p)}>{p}</button>
            ))}
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchProducts(pagination.page + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Product Image Upload */}
                <div className="product-image-upload-row">
                  <div
                    className="product-image-upload-preview"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload image"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <div className="product-image-upload-placeholder">
                        <Upload size={24} />
                        <span>Upload Image</span>
                      </div>
                    )}
                    <div className="product-image-upload-overlay">
                      <Upload size={16} />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div className="product-image-upload-info">
                    <span className="product-image-upload-title">Product Image</span>
                    <span className="product-image-upload-hint">JPG, PNG or WebP. Max 10MB.</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ marginTop: 6 }}
                    >
                      <Upload size={13} /> Choose File
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Stock</label>
                    <input className="form-input" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stock</label>
                    <input className="form-input" type="number" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Update' : 'Create'}</button>
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
