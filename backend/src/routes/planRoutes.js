import express from 'express'
import * as plans from '../controllers/planController.js'

// /api/plans
export const planRoutes = express.Router()
planRoutes.post('/', plans.createPlan)
planRoutes.patch('/:id', plans.updatePlan)
