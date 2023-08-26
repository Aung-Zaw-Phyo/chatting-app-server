const { validationResult } = require("express-validator")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const uuid = require('uuid')
const User = require('../../modals/chat/user')
const Group = require('../../modals/chat/group')
const GroupMessage = require('../../modals/chat/group_message')
const PrivateMessage = require('../../modals/chat/private_message')
const user = require("../../modals/chat/user")

exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            const errs =  errors.array().map(err => {
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

        let user = await User({name, email, password}).save()

        const token = jwt.sign({id: user.id, email: user.email}, 'chatroom 123!@#', { expiresIn: 24*60*60 })
        res.cookie('jwt', token, {httpOnly: true, maxAge: 24*60*60*1000})

        res.status(201).json({message: 'Successfully signed up.', data: {user}})
    } catch (error) {
        next(error)
    }
}

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            const errs =  errors.array().map(err => {
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

        const token = jwt.sign({id: user.id, email: user.email}, 'chatroom 123!@#', { expiresIn: 24*60*60 })
        res.cookie('jwt', token, {httpOnly: true, maxAge: 24*60*60*1000})

        res.status(201).json({message: 'Successfully signed up.', data: {user}})
    } catch (error) {
        next(error)
    }
}

exports.update = async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            const errs =  errors.array().map(err => {
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
       
        let checkEmail = await User.findOne({email: email, _id: {$ne: userId}})
        if(checkEmail) {
            const error = new Error('Email is already been taken.')
            error.statusCode = 422
            error.data = errs
            throw error
        }
        const user = await User.findById(userId);

        let image = null
        if(req.files && req.files.image){
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
        if(password) {
            hashedPass = await bcrypt.hash(password, 12)
        }

        let updateObj = {
            name: name,
            email: email,
            password: hashedPass
        }

        if(image) {
            updateObj = {
                name: name,
                email: email,
                image: `/uploads/users/${image}`,
                password: hashedPass
            }
        }

        const result = await User.findByIdAndUpdate(userId, updateObj);
        
        res.status(200).json({status: true, message: 'Successfully updated user.', data: {user: result}})
    } catch (error) {
        next(error)
    }
}

exports.logout = async (req, res, next) => {
    res.cookie('jwt', '', {maxAge: 1})
    res.status(200).json({Logout: true})
}

exports.deleteAccount = async (req, res, next) => {
    try{
        const userId = req.userId

        await GroupMessage.deleteMany({user: userId})
        await PrivateMessage.deleteMany({
            $or: [{to: userId}, {from: userId}]
        })

        // if creator, whole group and it's all messages is delete.
        const groupsByCreator = await Group.find({creator: userId})
        groupsByCreator.forEach(async (group) => {
            await GroupMessage.deleteMany({group: group.id})
        })
        await Group.deleteMany({creator: userId})

        const groupsByMember = await Group.find({members: userId})
        groupsByMember.forEach( async (group) => {
            const updateMembers = group.members.filter(member => member !== userId) 
            await Group.findByIdAndUpdate(group.id, {members: updateMembers})
        })

        await User.findByIdAndDelete(userId)

        res.cookie('jwt', '', {maxAge: 1})
        res.status(200).json({status: true, message: 'Successfully deleted account', data: null})
    } catch (error) {
        next(error)
    }  
}

exports.userList = async (req, res, next) => { // 'https://ui-avatars.com/api/?background=36404A&color=fff&name=' + ret.name
    try {
        const userId = req.userId
        let users = await User.find();
        let user = await User.findOne({_id: userId})
        let groups = await Group.find({ 
            $or: [{creator: userId}, {members: userId}]     
        }).populate(['creator', 'members'])
        res.status(201).json({message: 'Successfully fetched users.', data: {users: users, user: user, groups: groups}})
    } catch (error) {
        next(error)
    }
}

exports.searchUser = async (req, res, next) => {
    try{
        const search = req.params.search
        const users = await User.find({
            "$or" : [
                {name: {$regex: search, $options: 'i' }},
                {email: {$regex: search, $options: 'i' }}
            ]
        })
        res.status(200).json({status: true, message: 'Successfully fetched users', data: {users}})
    } catch (error) {
        next(error)
    }  
}