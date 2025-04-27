const express = require('express')
const adminController = require('../controllers/admin.controller')
const isAdminMiddleware = require('../middlewares/is-admin.middleware')
const validator = require('../utils/validator')

const adminRouter = express.Router()

adminRouter.get('/', isAdminMiddleware, adminController.getUsers)

adminRouter.get('/:id', validator.validateMongoId, isAdminMiddleware, adminController.userDetail)

adminRouter.delete('/:id', isAdminMiddleware, adminController.deleteAccount)

module.exports = adminRouter