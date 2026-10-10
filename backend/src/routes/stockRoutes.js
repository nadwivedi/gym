import express from 'express'
import * as stock from '../controllers/stockController.js'

// /api/stock: things the gym sells (protein, creatine, T-shirts …)
export const stockRoutes = express.Router()
stockRoutes.get('/', stock.listStock)
stockRoutes.get('/products/:id/ledger', stock.productLedger)
stockRoutes.post('/products', stock.createProduct)
stockRoutes.patch('/products/:id', stock.updateProduct)
stockRoutes.get('/moves', stock.listMoves)
stockRoutes.post('/moves', stock.createMove)
stockRoutes.delete('/moves/:id', stock.deleteMove)
