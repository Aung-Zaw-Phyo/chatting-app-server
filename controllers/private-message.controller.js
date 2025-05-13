const uuid = require('uuid')
const PrivateMessage = require('../models/private-message.model')
const User = require('../models/user.model');
const { emitMessage } = require('../services/socket.service');
const ObjectId = require("mongoose").Types.ObjectId;

exports.getMessages = async (req, res, next) => {
    try {
        const receiverId = req.query.receiverId
        const senderId = req.userId
        if (!ObjectId.isValid(receiverId)) {
            const error = new Error('Invalid Id')
            error.statusCode = 403
            throw error
        }

        const query = {
            $or: [
                { receiver: receiverId, sender: senderId }, 
                { receiver: senderId, sender: receiverId }
            ]
        }
        const [messages, totalItems, receiver] = await Promise.all([
            PrivateMessage.find(query).sort({
                createdAt: -1
            }).populate([
                { path: 'receiver', select: '_id name email' },
                { path: 'sender', select: '_id name email' }
            ]),
            PrivateMessage.find(query).countDocuments(),
            User.findById(receiverId).select('_id name email')
        ]);

        if (!receiver) {
            const error = new Error('Chat not found!')
            error.statusCode = 404
            throw error
        }
        res.status(200).json({
            status: true,
            message: 'Successfully fetched messages',
            data: {
                messages: messages.reverse(),
                totalItems: totalItems,
                to_account: receiver,
                status: 'private'
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.createMessage = async (req, res, next) => {
    try {
        const text = req.body.text
        if (text.trim() === '' && !req.files) {
            const error = new Error('Validation Failed!')
            error.statusCode = 422
            throw error
        }
        const receiverId = req.query.receiverId
        const senderId = req.userId
        if (!ObjectId.isValid(receiverId)) {
            const error = new Error('Invalid Id')
            error.statusCode = 403
            throw error
        }
        let image = null
        if (req.files && req.files.image) {
            const ext = req.files.image.name.split('.')[1]
            const array_of_allowed_files = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
            if (!array_of_allowed_files.includes(ext)) {
                const error = new Error('Please upload a valid image.')
                error.statusCode = 422
                throw error
            }
            image = `${uuid.v4()}.${ext}`
        }

        const result = await PrivateMessage({
            text: text,
            image: image ? `/uploads/messages/${image}` : null,
            receiver: receiverId,
            sender: senderId
        }).save()

        if (result) {
            image ? await req.files.image.mv(`./uploads/messages/${image}`) : null;
        }

        const message = await PrivateMessage.findOne(result._id).populate([
            { path: 'receiver', select: '_id name email' },
            { path: 'sender', select: '_id name email' }
        ])
        emitMessage(receiverId, 'receive-msg', message, 'PRIVATE')
        res.status(200).json({
            status: true,
            message: 'Successfully created message',
            data: {
                message: message
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.deleteMessage = async (req, res, next) => {
    try {
        const userId = req.userId
        const message_id = req.params.id;
        const message = await PrivateMessage.findOne({
            _id: message_id,
            sender: userId
        })
        if (!message) {
            const error = new Error('Unauthorized')
            error.statusCode = 403
            throw error
        }
        message.deleteOne()
        emitMessage(message.to.toString(), 'delete-msg', message, 'PRIVATE')
        res.status(200).json({
            status: true,
            message: 'Successfully deleted message',
            data: {
                message: message
            }
        })
    } catch (error) {
        next(error)
    }
}