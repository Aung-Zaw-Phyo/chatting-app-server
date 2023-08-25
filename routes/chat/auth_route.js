const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const ChatUser = require('../../modals/chat/user')
const isAuth = require('../../middleware/is-auth')

const auth = require('../../controllers/chat/auth_controller')

router.post('/signup', [
    body('name').trim().not().isEmpty().withMessage('Please enter your name'),
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {req}) => {
        return ChatUser.findOne({email: value}).then(user => {
            if(user) {
                return Promise.reject('Email is already been taken.')
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min: 6}).withMessage('Please enter your password')
], auth.signup)

router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email').custom((value, {req}) => {
        return ChatUser.findOne({email: value}).then(user => {
            if(!user) {
                return Promise.reject('Your credential is incorrect.')
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min: 6}).withMessage('Please enter your password')
], auth.login)

router.post('/update/profile', [
    body('name').trim().not().isEmpty().withMessage('Please enter your name'),
    body('email').isEmail().withMessage('Please enter a valid email'),
], isAuth, auth.update)


router.post('/logout', auth.logout)

router.post('/delete/account', isAuth, auth.deleteAccount)

router.get('/users', isAuth, auth.userList)

router.get('/users/:search', isAuth, auth.searchUser)


module.exports = router