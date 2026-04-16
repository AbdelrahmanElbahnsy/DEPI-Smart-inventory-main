import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 23, 64, 0.95)', border: '1px solid rgba(148,163,184,0.15)',
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
        ${payload[0].value?.toLocaleString()}
      </p>
    </div>
  );
};

export default function InventoryTrendChart({ data = [] }) {
  return (
    <div className="chart-card animate-fadeIn">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">Inventory Value Trend</div>
          <div className="chart-card-subtitle">Monthly inventory value overview</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="inventoryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#4361ee" strokeWidth={2.5}
            fill="url(#inventoryGrad)" dot={false} activeDot={{ r: 5, fill: '#4361ee', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
