import express from 'express'
import * as settings from '../controllers/settingsController.js'

// /api/bootstrap and /api/settings
export const settingsRoutes = express.Router()
settingsRoutes.get('/bootstrap', settings.bootstrap)
settingsRoutes.patch('/settings', settings.updateSettings)
