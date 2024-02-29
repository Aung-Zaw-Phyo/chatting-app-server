const express = require('express')
const router = express.Router()
const admin_controller = require('../controllers/admin_controller')
const isAuth = require('../middleware/is-auth')
const validator = require('../utils/validator')

router.get('/users', isAuth, admin_controller.getUsers)

router.get('/user/:id', validator.validateMongoId, isAuth, admin_controller.userDetail)

router.delete('/user/:id', isAuth, admin_controller.deleteAccount)

module.exports = router