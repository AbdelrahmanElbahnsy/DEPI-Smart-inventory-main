import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 23, 64, 0.95)', border: '1px solid rgba(148,163,184,0.15)',
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value} units
        </p>
      ))}
    </div>
  );
};

export default function StockMovementChart({ data = [] }) {
  return (
    <div className="chart-card animate-fadeIn">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">Stock Movement</div>
          <div className="chart-card-subtitle">Monthly inbound vs outbound</div>
        </div>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: '#10b981' }} />
            Inbound
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: '#f59e0b' }} />
            Outbound
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="inbound" name="Inbound" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="outbound" name="Outbound" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
