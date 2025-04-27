const express = require('express')
const isAuthMiddleware = require('../middlewares/is-auth.middleware')
const validator = require('../utils/validator')
const privateMessageController = require('../controllers/private-message.controller')

const privateMessageRouter = express.Router()

// get messages
privateMessageRouter.get('/:id', validator.validateMongoId, isAuthMiddleware, privateMessageController.getMessages)

// create message
privateMessageRouter.post('/create/:id', validator.validateMongoId, isAuthMiddleware, privateMessageController.createMessage)

privateMessageRouter.delete('/delete/:id', validator.validateMongoId, isAuthMiddleware, privateMessageController.deleteMessage)



module.exports = privateMessageRouter