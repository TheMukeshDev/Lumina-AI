// Simple health check for deployment smoke tests
module.exports = (req, res) => {
  const payload = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null
  };

  // If a browser visits the endpoint (Accept: text/html), return a small HTML page
  const accept = (req.headers && req.headers.accept) || '';
  if (accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lumina AI — Health</title><style>body{font-family:system-ui,Arial,sans-serif;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .card{max-width:720px;padding:24px;border-radius:8px;border:1px solid #eee;box-shadow:0 6px 18px rgba(0,0,0,0.06)}</style></head><body><div class="card"><h1>Health: OK</h1><pre>${JSON.stringify(payload,null,2)}</pre></div></body></html>`);
    return;
  }

  // Default: JSON for programmatic checks
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(payload);
};
