const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.']
    },
    image: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: [true, 'Password is required.']
    }
})

userSchema.pre('save', async function (next) {
    let user = this // old function, not es6
    if(user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 12)
    }
    next()
})

userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({email})
    if(user) {
        const isAuthenticated = await bcrypt.compare(password, user.password)
        if(isAuthenticated){
            return user;
        }
        const error = new Error('Validation Failed!')
        error.statusCode = 422
        error.data = [
            {
                name: 'password',
                message: 'Your password is incorrect'
            }
        ]
        throw error
    }else {
        const error = new Error('Validation Failed!')
        error.statusCode = 422
        error.data = [
            {
                name: 'email',
                message: 'Your credential is incorrect.'
            }
        ]
        throw error
    }
}

function transformUser(doc, ret, options) { 
    ret.id = ret._id;
    ret.image = ret.image ? 'http://localhost:5000' + ret.image : 'https://ui-avatars.com/api/?background=36404A&color=fff&name=' + ret.name
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
}

userSchema.set('toObject', { transform: transformUser });
userSchema.set('toJSON', { transform: transformUser });

const user = mongoose.model('ChatUser', userSchema)

module.exports = user 