const express = require('express')
const isAuthMiddleware = require('../middlewares/is-auth.middleware')
const validator = require('../utils/validator')
const privateMessageController = require('../controllers/private-message.controller')

const privateMessageRouter = express.Router()

privateMessageRouter.get('/', isAuthMiddleware, privateMessageController.getMessages)

privateMessageRouter.post('/', isAuthMiddleware, privateMessageController.createMessage)

privateMessageRouter.delete('/:id', validator.validateMongoId, isAuthMiddleware, privateMessageController.deleteMessage)



module.exports = privateMessageRouter