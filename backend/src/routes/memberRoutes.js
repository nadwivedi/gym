import express from 'express'
import * as members from '../controllers/memberController.js'

// /api/members
export const memberRoutes = express.Router()
memberRoutes.get('/', members.listMembers)
memberRoutes.post('/', members.createMember)
memberRoutes.get('/:id', members.getMemberDetail)
memberRoutes.patch('/:id', members.updateMember)
memberRoutes.delete('/:id', members.deleteMember)
memberRoutes.post('/:id/hide', members.hideMember)
memberRoutes.post('/:id/unhide', members.unhideMember)
memberRoutes.post('/:id/periods', members.renewMember)
