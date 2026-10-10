import express from 'express'
import * as backup from '../controllers/exportController.js'

// /api/export: backups
export const exportRoutes = express.Router()
exportRoutes.get('/members.csv', backup.membersCsv)
exportRoutes.get('/payments.csv', backup.paymentsCsv)
exportRoutes.get('/expenses.csv', backup.expensesCsv)
exportRoutes.get('/stock.csv', backup.stockCsv)
exportRoutes.get('/backup.json', backup.backupJson)
