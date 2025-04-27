const express = require('express')
const {
    body
} = require('express-validator')
const User = require('../models/user.model')
const isAuthMiddleware = require('../middlewares/is-auth.middleware')
const userController = require('../controllers/user.controller')

const userRouter = express.Router()

userRouter.post('/signup', [
    body('name').trim().not().isEmpty().withMessage('Please enter your name'),
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(user => {
            if (user) {
                return Promise.reject('Email is already been taken.')
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({
        min: 6
    }).withMessage('Please enter your password')
], userController.signup)

userRouter.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(user => {
            if (!user) {
                return Promise.reject('Your credential is incorrect.')
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({
        min: 6
    }).withMessage('Please enter your password')
], userController.login)

userRouter.post('/update/profile', [
    body('name').trim().not().isEmpty().withMessage('Please enter your name'),
    body('email').isEmail().withMessage('Please enter a valid email'),
], isAuthMiddleware, userController.update)

userRouter.post('/check/account', [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(user => {
            if (!user) {
                return Promise.reject('Your email is invalid.')
            }
        })
    }).normalizeEmail(),
], userController.checkAccount)

userRouter.post('/email/send', [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(user => {
            if (!user) {
                return Promise.reject('Your email is invalid.')
            }
        })
    }).normalizeEmail(),
], userController.sendEmail)

userRouter.post('/verify/account', userController.verifyAccount)

userRouter.post('/logout', userController.logout)

userRouter.post('/delete/account', isAuthMiddleware, userController.deleteAccount)

userRouter.get('/', isAuthMiddleware, userController.userList)

userRouter.get('/:search', isAuthMiddleware, userController.searchUser)


module.exports = userRouter