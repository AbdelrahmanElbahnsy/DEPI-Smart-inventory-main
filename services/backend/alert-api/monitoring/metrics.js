import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP Requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP Request Duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const httpResponseStatusCounter = new client.Counter({
  name: 'http_response_status_total',
  help: 'HTTP Response Status Counter',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Active Requests',
  labelNames: ['method', 'route'],
  registers: [register]
});

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  activeRequests.inc({ method: req.method, route: req.path });
  
  res.on('finish', () => {
    activeRequests.dec({ method: req.method, route: req.path });
    
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    
    const route = req.route ? (req.baseUrl + req.route.path) : req.path;
    
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };
    
    httpRequestTotal.inc(labels);
    httpResponseStatusCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  
  next();
};

export { register };
