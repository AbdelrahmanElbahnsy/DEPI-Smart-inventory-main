import { Package, AlertTriangle, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/helpers.js';

const cards = [
  {
    key: 'totalProducts',
    label: 'Total Products',
    icon: Package,
    iconBg: 'rgba(67, 97, 238, 0.12)',
    iconColor: '#4361ee',
    format: formatNumber,
    trend: '+12.5%',
    trendDir: 'up',
  },
  {
    key: 'lowStock',
    label: 'Low Stock Items',
    icon: AlertTriangle,
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#f59e0b',
    format: formatNumber,
    trend: '-3.2%',
    trendDir: 'down',
  },
  {
    key: 'totalOrders',
    label: 'Total Orders',
    icon: ShoppingCart,
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10b981',
    format: formatNumber,
    trend: '+8.1%',
    trendDir: 'up',
  },
  {
    key: 'inventoryValue',
    label: 'Inventory Value',
    icon: DollarSign,
    iconBg: 'rgba(124, 58, 237, 0.12)',
    iconColor: '#7c3aed',
    format: formatCurrency,
    trend: '+15.3%',
    trendDir: 'up',
  },
];

export default function StatCards({ stats = {} }) {
  return (
    <div className="stat-cards">
      {cards.map((card, index) => (
        <div
          key={card.key}
          className={`stat-card animate-fadeIn animate-fadeIn-delay-${index + 1}`}
          id={`stat-${card.key}`}
        >
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ '--icon-bg': card.iconBg, '--icon-color': card.iconColor }}>
              <card.icon />
            </div>
            <div className={`stat-card-trend ${card.trendDir}`}>
              {card.trendDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {card.trend}
            </div>
          </div>
          <div className="stat-card-value">{card.format(stats[card.key])}</div>
          <div className="stat-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
