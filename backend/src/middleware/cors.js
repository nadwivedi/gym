// Website addresses allowed to call the API from a browser: the gymsolution.in sites, plus any
// extra ones in CORS_ORIGINS in .env (comma-separated).
const defaultCorsOrigins = [
  'https://gymsolution.in',
  'https://www.gymsolution.in',
  'https://api.gymsolution.in',
]
const corsOrigins = [
  ...defaultCorsOrigins,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
]

export function cors(req, res, next) {
  const origin = req.get('Origin')
  if (!origin || !corsOrigins.includes(origin)) return next()
  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  })
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
}
