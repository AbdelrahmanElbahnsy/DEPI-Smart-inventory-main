import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/helpers.js';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Orders() {
  const { isOwner, isManager, isSecurity } = useAuth();
  const canCreate = !isSecurity; // Owner, Manager, Staff
  const canUpdateStatus = isOwner || isManager;
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const isAnyModalOpen = showCreateModal || showStatusModal;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showCreateModal, showStatusModal]);

  // Create order form
  const [orderForm, setOrderForm] = useState({
    type: 'purchase',
    supplierId: '',
    items: [{ productId: '', quantity: 1 }],
  });

  const fetchOrders = async () => {
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/orders/stats'),
      ]);
      setOrders(ordersRes.data.data.orders || []);
      setStats(statsRes.data.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [typeFilter, statusFilter]);

  // Load products + suppliers for the create form
  const openCreateModal = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/suppliers'),
      ]);
      setProducts(prodRes.data.data.products || []);
      setSuppliers(supRes.data.data.suppliers || []);
    } catch (e) { console.error(e); }
    setOrderForm({ type: 'purchase', supplierId: '', items: [{ productId: '', quantity: 1 }] });
    setShowCreateModal(true);
  };

  const addItem = () => {
    setOrderForm(prev => ({ ...prev, items: [...prev.items, { productId: '', quantity: 1 }] }));
  };

  const removeItem = (index) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, field, value) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: orderForm.type,
        supplierId: parseInt(orderForm.supplierId) || null,
        items: orderForm.items
          .filter(item => item.productId)
          .map(item => ({ productId: parseInt(item.productId), quantity: parseInt(item.quantity) || 1 })),
      };
      if (payload.items.length === 0) { toast.warning('Please add at least one product'); return; }
      await api.post('/orders', payload);
      toast.success('Order created successfully');
      setShowCreateModal(false);
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating order');
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.put(`/orders/${selectedOrder.id}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (e) { toast.error(e.response?.data?.message || 'Error updating status'); }
  };

  // Calculate order total preview
  const calcTotal = () => {
    return orderForm.items.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.productId));
      return sum + (product ? parseFloat(product.price) * (parseInt(item.quantity) || 0) : 0);
    }, 0);
  };

  const statusSteps = ['pending', 'processing', 'completed'];

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{stats.totalOrders || 0} total orders</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreateModal} id="add-order-btn">
            <Plus size={16} /> Add New Order
          </button>
        )}
      </div>

      <div className="stat-cards" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-card-value">{stats.totalOrders || 0}</div><div className="stat-card-label">Total Orders</div></div>
        <div className="stat-card"><div className="stat-card-value">{stats.pendingOrders || 0}</div><div className="stat-card-label">Pending</div></div>
        <div className="stat-card"><div className="stat-card-value">{formatCurrency(stats.totalRevenue)}</div><div className="stat-card-label">Total Revenue</div></div>
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-title">All Orders</div>
          <div className="data-table-actions">
            <select className="data-table-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
            </select>
            <select className="data-table-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Type</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan="8"><div className="skeleton skeleton-text" /></td></tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found</td></tr>
              ) : orders.map(o => {
                const status = getStatusBadge(o.status);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.orderNumber}</td>
                    <td><span className={`badge ${o.type === 'sale' ? 'badge-success' : 'badge-info'}`}>{o.type}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.supplier?.name || '—'}</td>
                    <td>{o.items?.length || 0}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(o.totalAmount)}</td>
                    <td><span className={`badge ${status.className}`}><span className="badge-dot" />{status.label}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                    <td>
                      {canUpdateStatus && o.status !== 'completed' && o.status !== 'cancelled' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => openStatusModal(o)}>
                          Update Status
                        </button>
                      )}
                      {o.status === 'completed' && (
                        <span style={{ fontSize: 11, color: 'var(--status-success)' }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showCreateModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Create New Order</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Order Type</label>
                    <select className="form-select" value={orderForm.type} onChange={e => setOrderForm({ ...orderForm, type: e.target.value })}>
                      <option value="purchase">Purchase (Buying)</option>
                      <option value="sale">Sale (Selling)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <select className="form-select" value={orderForm.supplierId} onChange={e => setOrderForm({ ...orderForm, supplierId: e.target.value })}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label className="form-label" style={{ margin: 0 }}>ORDER ITEMS</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={addItem}>+ Add Item</button>
                  </div>

                  {orderForm.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        {index === 0 && <label className="form-label">Product</label>}
                        <select className="form-select" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {formatCurrency(p.price)}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 0.7 }}>
                        {index === 0 && <label className="form-label">Qty</label>}
                        <input className="form-input" type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', e.target.value)} />
                      </div>
                      <button type="button" className="btn btn-icon btn-danger" style={{ marginBottom: 0, flexShrink: 0 }}
                        onClick={() => removeItem(index)} disabled={orderForm.items.length <= 1}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px 16px', background: 'rgba(67, 97, 238, 0.06)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Estimated Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(calcTotal())}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><ShoppingCart size={14} /> Create Order</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && selectedOrder && createPortal(
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Update Order Status</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Order: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.orderNumber}</strong>
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Current status: <span className={`badge ${getStatusBadge(selectedOrder.status).className}`}><span className="badge-dot" />{getStatusBadge(selectedOrder.status).label}</span>
              </p>

              {/* Status pipeline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
                {statusSteps.map((step, i) => {
                  const isCurrent = step === selectedOrder.status;
                  const isPast = statusSteps.indexOf(selectedOrder.status) > i;
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        background: isPast ? 'var(--status-success)' : isCurrent ? 'var(--accent-primary)' : 'var(--bg-input)',
                        color: isPast || isCurrent ? 'white' : 'var(--text-muted)',
                        border: isCurrent ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      }}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div style={{ width: 40, height: 2, background: isPast ? 'var(--status-success)' : 'var(--border-card)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, fontSize: 10, color: 'var(--text-muted)' }}>
                {statusSteps.map(s => <span key={s} style={{ textTransform: 'capitalize' }}>{s}</span>)}
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>Choose new status:</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {selectedOrder.status === 'pending' && (
                  <>
                    <button className="btn btn-primary" onClick={() => handleStatusUpdate('processing')}>➡ Processing</button>
                    <button className="btn btn-success" onClick={() => handleStatusUpdate('completed')}>✓ Completed</button>
                    <button className="btn btn-danger" onClick={() => handleStatusUpdate('cancelled')}>✕ Cancel</button>
                  </>
                )}
                {selectedOrder.status === 'processing' && (
                  <>
                    <button className="btn btn-success" onClick={() => handleStatusUpdate('completed')}>✓ Complete</button>
                    <button className="btn btn-danger" onClick={() => handleStatusUpdate('cancelled')}>✕ Cancel</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </AnimatedPage>
  );
}
