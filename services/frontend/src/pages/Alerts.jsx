import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Trash2, CheckCheck } from 'lucide-react';
import { timeAgo } from '../utils/helpers.js';
import api from '../services/api.js';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

const icons = { critical: AlertCircle, warning: AlertTriangle, info: Info };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (filter) params.type = filter;
      const { data } = await api.get('/alerts', { params });
      setAlerts(data.data.alerts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const markRead = async (id) => {
    await api.put(`/alerts/${id}/read`);
    fetchAlerts();
  };

  const markAllRead = async () => {
    await api.put('/alerts/read-all');
    fetchAlerts();
  };

  const dismiss = async (id) => {
    await api.delete(`/alerts/${id}`);
    fetchAlerts();
  };

  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <AnimatedPage>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}><CheckCheck size={16} /> Mark All Read</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'low_stock', 'out_of_stock', 'overstock'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)} style={{ fontSize: 12 }}>
            {f === '' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="alerts-panel" style={{ maxWidth: '100%' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 10 }} />)
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={40} />
            <h3>No alerts</h3>
            <p>All stock levels are healthy</p>
          </div>
        ) : (
          alerts.map(alert => {
            const Icon = icons[alert.severity] || Info;
            return (
              <div key={alert.id} className="alert-item" style={{ opacity: alert.isRead ? 0.5 : 1 }}>
                <div className={`alert-icon ${alert.severity}`}><Icon size={16} /></div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">{timeAgo(alert.createdAt)} · {alert.product?.name || ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!alert.isRead && (
                    <button className="btn btn-icon btn-success" onClick={() => markRead(alert.id)} title="Mark as read"><Check size={14} /></button>
                  )}
                  <button className="btn btn-icon btn-danger" onClick={() => dismiss(alert.id)} title="Dismiss"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </AnimatedPage>
  );
}
