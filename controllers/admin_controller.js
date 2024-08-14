const User = require('../models/user')
const Group = require('../models/group')
const GroupMessage = require('../models/group_message')
const PrivateMessage = require('../models/private_message')

exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find()
        res.status(200).json({
            status: true,
            message: 'Fetched users successfully.',
            data: {
                users: users
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.userDetail = async (req, res, next) => {
    try {
        const id = req.params.id
        const groups = await Group.find({
            creator: id
        }).countDocuments()
        const group_messages = await GroupMessage.find({
            user: id
        }).countDocuments()
        const private_messages = await PrivateMessage.find({
            from: id
        }).countDocuments()
        const user = await User.findById(id)
        res.status(200).json({
            status: true,
            message: 'Fetched users successfully.',
            data: {
                user,
                groups,
                group_messages,
                private_messages
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.deleteAccount = async (req, res, next) => {
    try {
        const userId = req.params.id

        await GroupMessage.deleteMany({
            user: userId
        })
        await PrivateMessage.deleteMany({
            $or: [{
                to: userId
            }, {
                from: userId
            }]
        })

        // if creator, whole group and it's all messages is delete.
        const groupsByCreator = await Group.find({
            creator: userId
        })
        groupsByCreator.forEach(async (group) => {
            await GroupMessage.deleteMany({
                group: group.id
            })
        })
        await Group.deleteMany({
            creator: userId
        })

        const groupsByMember = await Group.find({
            members: userId
        })
        groupsByMember.forEach(async (group) => {
            const updateMembers = group.members.filter(member => member !== userId)
            await Group.findByIdAndUpdate(group.id, {
                members: updateMembers
            })
        })

        await User.findByIdAndDelete(userId)

        res.status(200).json({
            status: true,
            message: 'Successfully deleted account',
            data: null
        })
    } catch (error) {
        next(error)
    }
}