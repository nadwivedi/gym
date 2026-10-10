import express from 'express'
import * as whatsapp from '../controllers/whatsappController.js'

// /api/whatsapp
export const whatsappRoutes = express.Router()
whatsappRoutes.use(whatsapp.loadWhatsApp)
whatsappRoutes.get('/status', whatsapp.status)
whatsappRoutes.post('/connect', whatsapp.connect)
whatsappRoutes.post('/renew-qr', whatsapp.renewQr)
whatsappRoutes.post('/cancel', whatsapp.cancel)
whatsappRoutes.post('/logout', whatsapp.logout)
whatsappRoutes.patch('/settings', whatsapp.updateSettings)
whatsappRoutes.get('/log', whatsapp.log)
