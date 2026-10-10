import express from 'express'
import * as auth from '../controllers/authController.js'
import { requireLogin } from '../middleware/requireLogin.js'

// /api/auth
export const authRoutes = express.Router()
authRoutes.get('/status', auth.status)
authRoutes.post('/signup', auth.signup)
authRoutes.post('/login', auth.login)
authRoutes.post('/change-login', requireLogin, auth.changeLogin)
