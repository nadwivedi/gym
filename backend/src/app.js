import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { cors } from './middleware/cors.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiRoutes } from './routes/index.js'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist')

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use('/api', cors)
  app.use(express.json({ limit: '200kb' }))
  app.use('/api', apiRoutes())

  // Serve the built app so one address works for both the PC and the phone.
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.use(errorHandler)
  return app
}
