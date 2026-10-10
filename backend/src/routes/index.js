import express from 'express'
import { requireLogin } from '../middleware/requireLogin.js'
import { authRoutes } from './authRoutes.js'
import { dashboardRoutes } from './dashboardRoutes.js'
import { expenseCategoryRoutes, expenseRoutes } from './expenseRoutes.js'
import { exportRoutes } from './exportRoutes.js'
import { memberRoutes } from './memberRoutes.js'
import { paymentRoutes } from './paymentRoutes.js'
import { periodRoutes } from './periodRoutes.js'
import { planRoutes } from './planRoutes.js'
import { settingsRoutes } from './settingsRoutes.js'
import { stockRoutes } from './stockRoutes.js'
import { whatsappRoutes } from './whatsappRoutes.js'

// Everything under /api.
export function apiRoutes() {
  const r = express.Router()
  r.use('/auth', authRoutes)

  // Everything below needs a valid login, and works only on that account's own gym.
  r.use(requireLogin)
  r.use(settingsRoutes)
  r.use(dashboardRoutes)
  r.use('/plans', planRoutes)
  r.use('/members', memberRoutes)
  r.use('/periods', periodRoutes)
  r.use('/payments', paymentRoutes)
  r.use('/expenses', expenseRoutes)
  r.use('/expense-categories', expenseCategoryRoutes)
  r.use('/stock', stockRoutes)
  r.use('/export', exportRoutes)
  r.use('/whatsapp', whatsappRoutes)

  r.use((req, res) => res.status(404).json({ error: 'Not found' }))
  return r
}
