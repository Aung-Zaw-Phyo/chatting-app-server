const express = require('express')
const router = express.Router()
const private_controller = require('../../controllers/chat/private_controller')
const isAuth = require('../../middleware/is-auth')
const validator = require('../../utils/validator')

// get messages
router.get('/:id', validator.validateMongoId, isAuth, private_controller.getMessages)

// create message
router.post('/create/:id', validator.validateMongoId, isAuth, private_controller.createMessage)

router.delete('/delete/:id', validator.validateMongoId, isAuth, private_controller.deleteMessage)



module.exports = router