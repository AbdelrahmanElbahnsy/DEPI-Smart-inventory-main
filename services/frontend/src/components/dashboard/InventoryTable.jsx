import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers.js';

export default function InventoryTable({ products = [] }) {
  return (
    <div className="data-table-container animate-fadeIn">
      <div className="data-table-header">
        <div className="data-table-title">Recent Inventory</div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Price</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</td></tr>
            ) : (
              products.slice(0, 10).map((product) => {
                const status = getStatusBadge(product.status);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="table-product-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="product-img-fallback" style={{ width: 38, height: 38, background: 'var(--accent-gradient)', color: '#fff', fontSize: 13 }}>{product.name?.charAt(0)}</div>
                        )}
                        <div>
                          <div className="table-product-name">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{product.sku}</td>
                    <td style={{ fontWeight: 600 }}>{product.quantity}</td>
                    <td>
                      <span className={`badge ${status.className}`}>
                        <span className="badge-dot" />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{product.supplier?.name || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(product.lastUpdated || product.updatedAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
