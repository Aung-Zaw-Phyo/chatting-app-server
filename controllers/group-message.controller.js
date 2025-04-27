const {
    validationResult
} = require("express-validator")
const uuid = require('uuid')
const Group = require('../models/group.model')
const GroupMessage = require('../models/group-message.model')
const {
    getIo
} = require('../socket')


exports.getGroups = async(req, res, next) => {
    try {
        const userId = req.userId
        let groups = await Group.find({
            $or: [{
                creator: userId
            }, {
                members: userId
            }]
        }).populate(['creator', 'members'])

        res.status(201).json({
            message: 'Successfully fetched users.',
            data: {
                groups: groups
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.searchGroup = async(req, res, next) => {
    try {
        const userId = req.userId
        const search = req.params.search
            //$or: [{to: to_id, from: from_id}, {to: from_id, from: to_id}]
        const groups = await Group.find({
            "$or": [{
                    name: {
                        $regex: search,
                        $options: 'i'
                    },
                    creator: userId
                },
                {
                    name: {
                        $regex: search,
                        $options: 'i'
                    },
                    members: userId
                },
            ]
        }).populate(['creator', 'members'])
        res.status(200).json({
            status: true,
            message: 'Successfully fetched groups',
            data: {
                groups
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.searchMember = async(req, res, next) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const errs = errors.array().map(err => {
                return {
                    name: err.path,
                    message: err.msg
                }
            })
            const error = new Error(errs[0].message)
            error.statusCode = 422
            error.data = errs
            throw error
        }
        const user = req.user
        res.status(200).json({
            status: true,
            message: 'Successfully fetched user',
            data: {
                user: user
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.createGroup = async(req, res, next) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const errs = errors.array().map(err => {
                return {
                    name: err.path,
                    message: err.msg
                }
            })
            const error = new Error(errs[0].message)
            error.statusCode = 422
            error.data = errs
            throw error
        }

        const userId = req.userId
        const group_name = req.body.group_name;
        const description = req.body.description;
        const members = req.body.members

        if (members.length < 2 || members.length > 20) {
            const error = new Error('Group must have at least 3 members (including you) or at most 20 members.')
            error.statusCode = 422
            error.data = null
            throw error
        }

        const memberArr = members.map(member => {
            return member.id
        })
        memberArr.push(req.userId)

        const result = await Group({
            name: group_name,
            description: description,
            creator: userId,
            members: memberArr
        }).save()

        const group = await Group.findById(result.id).populate(['creator', 'members'])

        res.status(200).json({
            status: true,
            message: 'Successfully fetched user',
            data: {
                group
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.getGroupMessages = async(req, res, next) => {
    try {
        const group_id = req.params.id
        const userId = req.userId

        const group = await Group.findById(group_id).populate(['creator', 'members'])
        if (!group) {
            const error = new Error('Chat not found!')
            error.statusCode = 404
            throw error
        }

        const totalItems = await GroupMessage.find({
            group: group_id
        }).countDocuments()
        const result = await GroupMessage.find({
            group: group_id
        }).sort({
            createdAt: -1
        }).populate([
            'group', 'user'
        ])

        const messages = result.reverse()

        res.status(200).json({
            status: true,
            message: 'Successfully fetched messages',
            data: {
                messages: messages,
                totalItems: totalItems,
                group: group,
                status: 'group'
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.createGroupMessage = async(req, res, next) => {
    try {
        const text = req.body.text
        if (text.trim() === '' && !req.files) {
            const error = new Error('Validation Failed!')
            error.statusCode = 422
            throw error
        }
        const group_id = req.params.id;
        const userId = req.userId
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

        const result = await GroupMessage({
            text: text,
            image: image ? `/uploads/messages/${image}` : null,
            group: group_id,
            user: userId
        }).save()

        if (result) {
            image ? await req.files.image.mv(`./uploads/messages/${image}`) : null;
        }
        const message = await GroupMessage.findOne(result._id).populate([
            'group', 'user'
        ])
        const group = await Group.findById(group_id)
        const roomIds = group.members.map(member => {
            if (member.toString() !== userId.toString()) {
                return member.toString()
            }
        })
        console.log(roomIds)
        for (const roomId of roomIds) {
            getIo().to(roomId).emit('receive-msg', {
                message: message,
                type: 'GROUP'
            })
        }
        // getIo().to(group_id).emit('receive-msg', {message: message, type: 'GROUP'})
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

exports.leaveGroup = async(req, res, next) => {
    try {
        const group_id = req.params.id
        const group = await Group.findById(group_id)
        if (!group) {
            const error = new Error('Group not found!')
            error.statusCode = 404
            throw error
        }
        const result = group.members.filter((member) => {
            return member.toString() !== req.userId
        })
        await group.updateOne({
            members: result
        })

        res.status(200).json({
            status: true,
            message: 'Successfully leaved group',
            data: null
        })
    } catch (error) {
        next(error)
    }
}

exports.deleteGroup = async(req, res, next) => {
    try {
        const userId = req.userId
        const group_id = req.params.id

        const group = await Group.findById(group_id)

        if (!group) {
            const error = new Error('Group not found!')
            error.statusCode = 404
            throw error
        }

        if (userId.toString() !== group.creator.toString()) {
            const error = new Error('Unauthorized!')
            error.statusCode = 403
            throw error
        }

        await GroupMessage.deleteMany({
            group: group.id
        })
        await group.deleteOne()

        res.status(200).json({
            status: true,
            message: 'Successfully deleted group',
            data: null
        })
    } catch (error) {
        next(error)
    }
}

exports.deleteMessage = async(req, res, next) => {
    try {
        const userId = req.userId
        const message_id = req.params.id;
        const message = await GroupMessage.findOne({
            _id: message_id,
            user: userId
        })
        if (!message) {
            const error = new Error('Unauthorized')
            error.statusCode = 403
            throw error
        }
        message.deleteOne()
        console.log(message.group.toString())
        getIo().to(message.group.toString()).emit('delete-msg', {
            message: message,
            type: 'GROUP'
        })
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