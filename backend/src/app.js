import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { api } from './routes.js'
import { HttpError } from './validate.js'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist')

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
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
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on the server' })
  })
  return app
}
