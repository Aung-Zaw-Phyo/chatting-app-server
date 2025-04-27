const express = require('express')
const {
    body
} = require('express-validator')
const ChatUser = require('../models/user.model')
const isAuthMiddleware = require('../middlewares/is-auth.middleware')
const validator = require('../utils/validator')
const groupMessageController = require('../controllers/group-message.controller')

const groupMessageRouter = express.Router()

// get groups
groupMessageRouter.get('/', isAuthMiddleware, groupMessageController.getGroups)

groupMessageRouter.get('/:search', isAuthMiddleware, groupMessageController.searchGroup)

// get group's messages
groupMessageRouter.get('/messages/:id', validator.validateMongoId, isAuthMiddleware, groupMessageController.getGroupMessages)

// delete group's message
groupMessageRouter.delete('/message/:id', validator.validateMongoId, isAuthMiddleware, groupMessageController.deleteMessage)

// create group
groupMessageRouter.post('/create', isAuthMiddleware, [
    body('group_name').trim().not().isEmpty().withMessage('Group name is required.'),
], groupMessageController.createGroup)

// create group message
groupMessageRouter.post('/create/:id', validator.validateMongoId, isAuthMiddleware, groupMessageController.createGroupMessage)

groupMessageRouter.post('/search/member', isAuthMiddleware, [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return ChatUser.findOne({
            email: value
        }).then(user => {
            // {email: value, _id: {$ne: req.userId}}
            if (!user) {
                return Promise.reject('User not found.')
            }
            if (user) {
                if (req.userId === user.id) {
                    return Promise.reject('Please add another person.')
                }
                req.user = user
            }
        })
    }).normalizeEmail(),
], groupMessageController.searchMember)

groupMessageRouter.put('/leave/:id', isAuthMiddleware, validator.validateMongoId, groupMessageController.leaveGroup)

groupMessageRouter.delete('/delete/:id', isAuthMiddleware, validator.validateMongoId, groupMessageController.deleteGroup)



module.exports = groupMessageRouter