import client from 'prom-client';

const register = new client.Registry();

// Call collectDefaultMetrics() to gather default node metrics
client.collectDefaultMetrics({ register });

// 1. Total HTTP Requests (Counter)
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP Requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 2. HTTP Request Duration (Histogram)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP Request Duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// 3. HTTP Response Status Counter
const httpResponseStatusCounter = new client.Counter({
  name: 'http_response_status_total',
  help: 'HTTP Response Status Counter',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 4. Active Requests (Gauge)
const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Active Requests',
  labelNames: ['method', 'route'],
  registers: [register]
});

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  // Track active requests on start
  activeRequests.inc({ method: req.method, route: req.path });
  
  res.on('finish', () => {
    // Decrement active requests on finish
    activeRequests.dec({ method: req.method, route: req.path });
    
    // Calculate duration in seconds
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    
    // Use the matched route path if available, otherwise fallback to the URL path
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
