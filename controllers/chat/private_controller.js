const uuid = require('uuid')
const PrivateMessage = require('../../modals/chat/private_message')
const User = require('../../modals/chat/user')
const { getIo } = require('../../socket')

exports.getMessages = async(req, res, next) => {
    try {
        const to_id = req.params.id
        const from_id = req.userId
        const currentPage = req.query.page || 1
        const perPage = 12

        const totalItems = await PrivateMessage.find({ 
            $or: [{to: to_id, from: from_id}, {to: from_id, from: to_id}]     
        }).countDocuments()
        // const result = await PrivateMessage.find({ 
        //     $or: [{to: to_id, from: from_id}, {to: from_id, from: to_id}]     
        // }).sort({createdAt: -1}).skip((currentPage - 1) * perPage).limit(perPage).populate([
        //     {path: 'to', select: '_id name email'}, 
        //     {path: 'from', select: '_id name email'}
        // ])
        const result = await PrivateMessage.find({ 
            $or: [{to: to_id, from: from_id}, {to: from_id, from: to_id}]     
        }).sort({createdAt: -1}).populate([
            {path: 'to', select: '_id name email'}, 
            {path: 'from', select: '_id name email'}
        ])
        const messages = result.reverse()
        const user = await User.findOne({_id: to_id})
        if(!user) {
            const error = new Error('Chat not found!')
            error.statusCode = 404
            throw error
        }
        res.status(200).json({status: true, message: 'Successfully fetched messages', data: {messages: messages, totalItems: totalItems, to_account: user, status: 'private'}})
    } catch (error) {
        next(error)
    }   
}

exports.createMessage = async (req, res, next) => {
    try {
        const text = req.body.text
        if(text.trim() === '' && !req.files) {
            const error = new Error('Validation Failed!')
            error.statusCode = 422
            throw error
        }
        const to_id = req.params.id;
        const from_id = req.userId
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
        }

        const result = await PrivateMessage({
            text: text,
            image: image ? `/uploads/messages/${image}` : null,
            to: to_id,      
            from: from_id
        }).save() 
        
        if(result) {
            image ? await req.files.image.mv(`./uploads/messages/${image}`) : null ;
        }

        const message = await PrivateMessage.findOne(result._id).populate([
            {path: 'to', select: '_id name email'}, 
            {path: 'from', select: '_id name email'}
        ])

        getIo().to(to_id).emit('receive-msg', {message: message, type: 'PRIVATE'})
        res.status(200).json({status: true, message: 'Successfully created message', data: {message: message}})
    } catch (error) {
        next(error)
    }
}

