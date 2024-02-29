const express = require('express')
const router = express.Router()
const admin_controller = require('../controllers/admin_controller')
const isAdmin = require('../middleware/is-admin')
const validator = require('../utils/validator')

router.get('/users', isAdmin, admin_controller.getUsers)

router.get('/user/:id', validator.validateMongoId, isAdmin, admin_controller.userDetail)

router.delete('/user/:id', isAdmin, admin_controller.deleteAccount)

module.exports = router