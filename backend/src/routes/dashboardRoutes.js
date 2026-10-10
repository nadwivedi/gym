import express from 'express'
import * as dashboard from '../controllers/dashboardController.js'

// /api/dashboard and /api/stats
export const dashboardRoutes = express.Router()
dashboardRoutes.get('/dashboard', dashboard.dashboard)
dashboardRoutes.get('/stats', dashboard.stats)
