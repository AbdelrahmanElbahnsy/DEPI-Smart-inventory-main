import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/helpers.js';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Inventory() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, ovRes] = await Promise.all([
          api.get('/products', { params: { search, status: statusFilter || undefined, limit: 50 } }),
          api.get('/inventory'),
        ]);
        setProducts(prodRes.data.data.products || []);
        setOverview(ovRes.data.data || {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [search, statusFilter]);

  const handleQuantityUpdate = async (productId, newQty) => {
    try {
      await api.put(`/inventory/${productId}`, { quantity: parseInt(newQty) });
      toast.success('Stock updated successfully');
      const { data } = await api.get('/products', { params: { search, status: statusFilter || undefined, limit: 50 } });
      setProducts(data.data.products || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Total value: {formatCurrency(overview.totalValue)}</p>
        </div>
      </div>

      <div className="stat-cards" style={{ marginBottom: 20 }}>
        {[
          { label: 'In Stock', value: overview.statusCounts?.in_stock || 0, cls: 'badge-success' },
          { label: 'Low Stock', value: overview.statusCounts?.low_stock || 0, cls: 'badge-warning' },
          { label: 'Out of Stock', value: overview.statusCounts?.out_of_stock || 0, cls: 'badge-danger' },
          { label: 'Overstock', value: overview.statusCounts?.overstock || 0, cls: 'badge-info' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }}
            onClick={() => setStatusFilter(s.label.toLowerCase().replace(/ /g, '_'))}>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-search">
            <Search size={15} />
            <input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="data-table-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstock">Overstock</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Min / Max</th>
                <th>Status</th>
                <th>Price</th>
                <th>Value</th>
                <th>Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan="8"><div className="skeleton skeleton-text" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No items found</td></tr>
              ) : products.map((p) => {
                const status = getStatusBadge(p.status);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        {p.image ? (
                          <img src={p.image} alt="" className="table-product-img" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="product-img-fallback" style={{ width: 38, height: 38, background: 'var(--accent-gradient)', color: '#fff', fontSize: 13 }}>{p.name?.charAt(0)}</div>
                        )}
                        <div className="table-product-name">{p.name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</td>
                    <td style={{ fontWeight: 700, fontSize: 15 }}>{p.quantity}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.minStock} / {p.maxStock}</td>
                    <td><span className={`badge ${status.className}`}><span className="badge-dot" />{status.label}</span></td>
                    <td>{formatCurrency(p.price)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price * p.quantity)}</td>
                    <td>
                      <input type="number" min="0" className="form-input" style={{ width: 80, padding: '6px 10px', fontSize: 12 }}
                        defaultValue={p.quantity}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== p.quantity) handleQuantityUpdate(p.id, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
