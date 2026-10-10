import express from 'express'
import * as periods from '../controllers/periodController.js'

// /api/periods: membership periods
export const periodRoutes = express.Router()
periodRoutes.patch('/:id', periods.updatePeriod)
periodRoutes.delete('/:id', periods.deletePeriod)
periodRoutes.post('/:id/cancel', periods.cancelPeriod)
periodRoutes.post('/:id/refund', periods.refundPeriod)
periodRoutes.post('/:id/waive', periods.waivePeriod)
