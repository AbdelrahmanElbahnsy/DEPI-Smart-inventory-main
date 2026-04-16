import { useEffect, useState } from 'react';
import StatCards from '../components/dashboard/StatCards.jsx';
import AlertsPanel from '../components/dashboard/AlertsPanel.jsx';
import InventoryTable from '../components/dashboard/InventoryTable.jsx';
import InventoryTrendChart from '../components/charts/InventoryTrendChart.jsx';
import StockMovementChart from '../components/charts/StockMovementChart.jsx';
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart.jsx';
import api from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../context/ToastContext.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, connected } = useSocket();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const defaultValue = { data: { data: {} } };
      const productsDefault = { data: { data: { products: [] } } };
      const trendsDefault = { data: { data: { trends: [] } } };

      const [statsRes, productsRes, alertsRes, trendsRes, invRes, orderStatsRes] = await Promise.all([
        api.get('/products/stats').catch(() => defaultValue),
        api.get('/products?limit=10').catch(() => productsDefault),
        api.get('/alerts?isRead=false').catch(() => ({ data: { data: { alerts: [] } } })),
        api.get('/inventory/trends').catch(() => trendsDefault),
        api.get('/inventory').catch(() => defaultValue),
        api.get('/orders/stats').catch(() => defaultValue),
      ]);

      const dashboardStats = statsRes.data.data || {};
      const orderStats = orderStatsRes.data.data || {};

      setStats({
        ...dashboardStats,
        totalOrders: orderStats.totalOrders || 0,
      });

      setProducts(productsRes.data.data.products || []);
      setAlerts(alertsRes.data.data.alerts || []);
      setTrends(trendsRes.data.data.trends || []);
      setCategories(invRes.data.data.categoryDistribution || []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!connected) return;

    const unsubs = [];

    unsubs.push(on('new-alert', (data) => {
      setAlerts(prev => [data, ...prev]);
      toast.warning(data.message || 'New stock alert received');
    }));

    unsubs.push(on('stock-update', (data) => {
      toast.info(`Stock updated: ${data.productName || 'Product'}`);
      fetchData(); // Refresh all stats
    }));

    unsubs.push(on('order-update', (data) => {
      toast.success(`Order ${data.orderNumber || ''} status: ${data.status || 'updated'}`);
      fetchData();
    }));

    return () => unsubs.forEach(fn => fn && fn());
  }, [connected, on]);

  if (loading) {
    return (
      <div className="dashboard-grid">
        <div className="stat-cards">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="charts-row">
          <div className="skeleton" style={{ height: 350, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 350, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage>
    <div className="dashboard-grid">
      <StatCards stats={stats} />

      <div className="charts-row">
        <InventoryTrendChart data={trends} />
        <CategoryDistributionChart data={categories} />
      </div>

      <div className="charts-row">
        <StockMovementChart data={trends} />
        <AlertsPanel alerts={alerts} />
      </div>

      <InventoryTable products={products} />
    </div>
    </AnimatedPage>
  );
}
