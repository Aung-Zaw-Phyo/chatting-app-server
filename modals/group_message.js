const mongoose = require('mongoose')
const Schema = mongoose.Schema

const messageSchema = new Schema({
    text: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})


function transformMessage(doc, ret, options) {
    ret.id = ret._id;
    ret.image = ret.image ? `http://localhost:${process.env.PORT}` + ret.image : null
    delete ret._id;
    delete ret.__v;
    return ret;
}

messageSchema.set('toObject', {
    transform: transformMessage
});
messageSchema.set('toJSON', {
    transform: transformMessage
});

const message = mongoose.model('GroupMessage', messageSchema)

module.exports = message