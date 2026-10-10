import { HttpError } from '../utils/validate.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request' })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That is too large to save. A receipt can be up to 8 MB.' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server' })
}
