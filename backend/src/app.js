import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { api } from './routes.js'
import { HttpError } from './validate.js'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist')

// Website addresses allowed to call the API from a browser (CORS_ORIGINS in .env, comma-separated).
// Empty is the usual setup: this server serves the website itself, so no other address needs access.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean)

function cors(req, res, next) {
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

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (corsOrigins.length) app.use('/api', cors)
  app.use(express.json({ limit: '200kb' }))
  app.use('/api', api())

  // Serve the built app so one address works for both the PC and the phone.
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request' })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That is too large to save. A receipt can be up to 8 MB.' })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on the server' })
  })
  return app
}
