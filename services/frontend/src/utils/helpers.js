export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value || 0);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

export const getStatusBadge = (status) => {
  const map = {
    in_stock: { label: 'In Stock', className: 'badge-success' },
    low_stock: { label: 'Low Stock', className: 'badge-warning' },
    out_of_stock: { label: 'Out of Stock', className: 'badge-danger' },
    overstock: { label: 'Overstock', className: 'badge-info' },
    active: { label: 'Active', className: 'badge-success' },
    inactive: { label: 'Inactive', className: 'badge-danger' },
    pending: { label: 'Pending', className: 'badge-warning' },
    processing: { label: 'Processing', className: 'badge-info' },
    completed: { label: 'Completed', className: 'badge-success' },
    cancelled: { label: 'Cancelled', className: 'badge-danger' },
  };
  return map[status] || { label: status, className: 'badge-info' };
};
