const {
    validationResult
} = require("express-validator")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const uuid = require('uuid')
const User = require('../modals/user')
const Group = require('../modals/group')
const GroupMessage = require('../modals/group_message')
const PrivateMessage = require('../modals/private_message')
const { sendEmailVerificationLink } = require("../utils/mail")
const { shuffledString, storeDataInCache, getDataFromCache } = require("../utils/helper")
const mongoose = require("mongoose")

exports.signup = async(req, res, next) => {
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

        const name = req.body.name
        const email = req.body.email
        const password = req.body.password

        const generatedString = shuffledString(email)
        storeDataInCache(generatedString, email)
        sendEmailVerificationLink(email, generatedString)
        let user = await User({
            name,
            email,
            password
        }).save()

        res.status(201).json({
            message: 'Successfully signed up.',
            data: {
                user
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.login = async(req, res, next) => {
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
        const email = req.body.email
        const password = req.body.password

        let user = await User.login(email, password);
        if (!user.isVerified) {
            const generatedString = shuffledString(email)
            storeDataInCache(generatedString, email)
            sendEmailVerificationLink(email, generatedString)
            const error = new Error('Please verify your account!')
            error.statusCode = 401
            error.data = null
            throw error
        }

        const token = jwt.sign({
                id: user.id,
                email: user.email,
                status: user.status,
            }, process.env.SECRET_KEY, {
                expiresIn: 24 * 60 * 60
            })
            // res.cookie('jwt', token, {httpOnly: true, maxAge: 24*60*60*1000})

        res.status(201).json({
            message: 'Successfully signed in.',
            data: {
                user,
                token
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.checkAccount = async(req, res, next) => {
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
            error.statusCode = 404
            error.data = errs
            throw error
        }
        const email = req.body.email

        let user = await User.findOne({ email });
        res.status(200).json({
            message: 'success',
            data: {
                user
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.sendEmail = async(req, res, next) => {
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
        const email = req.body.email
        const generatedString = shuffledString(email)
        storeDataInCache(generatedString, email)
        sendEmailVerificationLink(email, generatedString)
        res.status(200).json({
            message: 'success',
            data: null
        })

    } catch (error) {
        next(error)
    }
}

exports.update = async(req, res, next) => {
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
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;

        let checkEmail = await User.findOne({
            email: email,
            _id: {
                $ne: userId
            }
        })
        if (checkEmail) {
            const error = new Error('Email is already been taken.')
            error.statusCode = 422
            error.data = errs
            throw error
        }
        const user = await User.findById(userId);

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
            await req.files.image.mv(`./uploads/users/${image}`)
        }

        let hashedPass = user.password
        if (password) {
            hashedPass = await bcrypt.hash(password, 12)
        }

        let updateObj = {
            name: name,
            email: email,
            password: hashedPass
        }

        if (image) {
            updateObj = {
                name: name,
                email: email,
                image: `/uploads/users/${image}`,
                password: hashedPass
            }
        }

        const result = await User.findByIdAndUpdate(userId, updateObj);

        res.status(200).json({
            status: true,
            message: 'Successfully updated user.',
            data: {
                user: result
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.logout = async(req, res, next) => {
    res.cookie('jwt', '', {
        maxAge: 1
    })
    res.status(200).json({
        Logout: true
    })
}

exports.verifyAccount = async(req, res, next) => {
    try {
        const key = req.body.key
        const email = getDataFromCache(key)
        let user = await User.findOne({ email })
        if (!user) {
            const error = new Error('Your verification is expired or invalid. Please login!')
            error.statusCode = 422
            error.data = null
            throw error
        }
        await User.findByIdAndUpdate(user._id, { isVerified: true })
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            status: user.status,
        }, process.env.SECRET_KEY, {
            expiresIn: 24 * 60 * 60
        })

        res.status(200).json({
            status: true,
            message: 'Your account is verified successfully!',
            data: {
                user,
                token
            }
        })
    } catch (error) {
        next(error)
    }

}

exports.deleteAccount = async(req, res, next) => {
    try {
        const userId = req.userId

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
        groupsByCreator.forEach(async(group) => {
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
        groupsByMember.forEach(async(group) => {
            const updateMembers = group.members.filter(member => member !== userId)
            await Group.findByIdAndUpdate(group.id, {
                members: updateMembers
            })
        })

        await User.findByIdAndDelete(userId)

        // res.cookie('jwt', '', {maxAge: 1})
        res.status(200).json({
            status: true,
            message: 'Successfully deleted account',
            data: null
        })
    } catch (error) {
        next(error)
    }
}

exports.userList = async(req, res, next) => {
    try {
        const userId = req.userId
        const messageIds = (await PrivateMessage.aggregate([{
                $match: {
                    $or: [{
                        to: new mongoose.Types.ObjectId(userId),
                    }, {
                        from: new mongoose.Types.ObjectId(userId)
                    }]
                },
            },
            {
                $sort: {
                    "createdAt": -1
                }
            },
        ])).map(obj => [obj.to, obj.from]).flat();
        const userIds = messageIds.filter(messageId => messageId != userId);

        let users = await User.aggregate([
            { $match: { _id: { $in: userIds } } },
            {
                $addFields: {
                    __order: { $indexOfArray: [userIds, '$_id'] }
                }
            },
            { $sort: { __order: 1 } },
            { $unset: '__order' }
        ]).then((docs) => {
            return docs.map(doc => {
                doc.id = doc._id;
                doc.image = doc.image ? `http://localhost:${process.env.PORT}` + doc.image : 'https://ui-avatars.com/api/?background=36404A&color=fff&name=' + doc.name
                delete doc._id;
                delete doc.__v;
                delete doc.password;
                return doc;
            });
        });

        let user = await User.findOne({
            _id: userId
        })
        let groups = await Group.find({
            members: userId
        }).populate(['creator', 'members'])

        res.status(201).json({
            status: true,
            message: 'Successfully fetched users.',
            data: {
                users: users,
                user: user,
                groups: groups
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.searchUser = async(req, res, next) => {
    try {
        const search = req.params.search
        const users = await User.find({
            "$or": [{
                    name: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i'
                    }
                }
            ]
        })
        res.status(200).json({
            status: true,
            message: 'Successfully fetched users',
            data: {
                users
            }
        })
    } catch (error) {
        next(error)
    }
}