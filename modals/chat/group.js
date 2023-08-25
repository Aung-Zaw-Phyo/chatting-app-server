const mongoose = require('mongoose') 
const Schema = mongoose.Schema

const groupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },  
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'ChatUser',
        required: true
    },
    members: [
        { 
            type: Schema.Types.ObjectId, 
            ref: "ChatUser" 
        }
    ]
}, {timestamps: true})


function transformGroup(doc, ret, options) {
    ret.id = ret._id;
    ret.image = 'https://ui-avatars.com/api/?background=36404A&color=fff&name=' + ret.name
    delete ret._id;
    delete ret.__v;
    return ret;
}

groupSchema.set('toObject', { transform: transformGroup });
groupSchema.set('toJSON', { transform: transformGroup });

const group = mongoose.model('ChatGroup', groupSchema)

module.exports = group