const express = require('express');
const {
    body
} = require('express-validator')
const User = require('../models/user.model')
const isAuthMiddleware = require('../middlewares/is-auth.middleware');
const groupMessageController = require('../controllers/group-message.controller')
const validator = require('../utils/validator')
const groupRouter = express.Router();

// GET /groups -> get groups
groupRouter.get('/', isAuthMiddleware, groupMessageController.getGroups);

// GET /groups/:search -> search groups
groupRouter.get('/:search', isAuthMiddleware, groupMessageController.searchGroups)

// GET /groups/:id/messages -> get all messages of group
groupRouter.get('/:id/messages', validator.validateMongoId, isAuthMiddleware, groupMessageController.getGroupMessages)

// DELETE /groups/:id/messages/:messageId -> delete message
groupRouter.delete('/:id/messages/:messageId', validator.validateMongoId, isAuthMiddleware, groupMessageController.deleteMessage)

// POST /groups -> create group
groupRouter.post('/', isAuthMiddleware, [
    body('group_name').trim().not().isEmpty().withMessage('Group name is required.'),
], groupMessageController.createGroup)

// POST /groups/:id/messages -> create message
groupRouter.post('/:id/messages', validator.validateMongoId, isAuthMiddleware, groupMessageController.createGroupMessage)

// POST /groups/search-member -> search member
groupRouter.post('/search-member', isAuthMiddleware, [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
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

// PUT /groups/:id -> leave group
groupRouter.put('/:id/leave', isAuthMiddleware, validator.validateMongoId, groupMessageController.leaveGroup)

// DELETE /groups/:id -> delete group
groupRouter.delete('/:id', isAuthMiddleware, validator.validateMongoId, groupMessageController.deleteGroup)

module.exports = groupRouter;