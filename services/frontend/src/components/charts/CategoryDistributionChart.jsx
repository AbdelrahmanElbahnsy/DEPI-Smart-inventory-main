import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/helpers.js';

const COLORS = ['#4361ee', '#7c3aed', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(15, 23, 64, 0.95)', border: '1px solid rgba(148,163,184,0.15)',
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{data.name}</p>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>{data.count} products</p>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>{formatCurrency(data.value)}</p>
    </div>
  );
};

export default function CategoryDistributionChart({ data = [] }) {
  return (
    <div className="chart-card animate-fadeIn">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">Category Distribution</div>
          <div className="chart-card-subtitle">Products by category</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '0 8px' }}>
        {data.map((item, index) => (
          <div key={item.name} className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
            {item.name} ({item.count})
          </div>
        ))}
      </div>
    </div>
  );
}
