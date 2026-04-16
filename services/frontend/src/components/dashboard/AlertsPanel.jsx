import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { timeAgo } from '../../utils/helpers.js';

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function AlertsPanel({ alerts = [] }) {
  const displayAlerts = alerts.slice(0, 8);

  return (
    <div className="alerts-panel animate-fadeIn">
      <div className="alerts-panel-header">
        <div className="alerts-panel-title">Recent Alerts</div>
        {alerts.length > 0 && (
          <span className="alerts-count">{alerts.length}</span>
        )}
      </div>

      {displayAlerts.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <AlertTriangle size={32} />
          <h3>No active alerts</h3>
          <p>All stock levels are healthy</p>
        </div>
      ) : (
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {displayAlerts.map((alert) => {
            const Icon = severityIcons[alert.severity] || Info;
            return (
              <div key={alert.id} className="alert-item">
                <div className={`alert-icon ${alert.severity}`}>
                  <Icon size={16} />
                </div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">
                    <Clock size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    {timeAgo(alert.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
