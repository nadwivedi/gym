import express from 'express'
import * as payments from '../controllers/paymentController.js'

// /api/payments
export const paymentRoutes = express.Router()
paymentRoutes.get('/', payments.listPayments)
paymentRoutes.post('/', payments.createPayment)
paymentRoutes.patch('/:id', payments.updatePayment)
paymentRoutes.post('/:id/move', payments.movePayment)
paymentRoutes.post('/:id/void', payments.voidPayment)
