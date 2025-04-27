const express = require('express')
const adminController = require('../controllers/admin.controller')
const isAdminMiddleware = require('../middlewares/is-admin.middleware')
const validator = require('../utils/validator')

const adminRouter = express.Router()

adminRouter.get('/users', isAdminMiddleware, adminController.getUsers)

adminRouter.get('/user/:id', validator.validateMongoId, isAdminMiddleware, adminController.userDetail)

adminRouter.delete('/user/:id', isAdminMiddleware, adminController.deleteAccount)

module.exports = adminRouter