const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const path = require('path')
const app = express()
require('dotenv').config()

// scheduler
require("./config/scheduler")

// Routers
const userRouter = require('./routes/user.routes')
const privateMessageRouter = require('./routes/private-message.routes')
const adminRouter = require('./routes/admin.routes')
const groupRouter = require('./routes/group.routes')

const corsOptions = {
    origin: ['http://localhost:3000', 'https://chat.aungzawphyo.com', 'https://chat-gamma-dun.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(fileUpload());
app.use(express.json());
const uploadedFiles = express.static(path.join(__dirname, "uploads"));
app.use("/uploads", uploadedFiles);

app.get('/', async(req, res, next) => {
    res.status(200).send({ message: 'Server is running on: ' + PORT })
})

app.use('/api/users', userRouter)
app.use('/api/private-messages', privateMessageRouter)
app.use('/api/groups', groupRouter)
app.use('/api/admins', adminRouter)

app.use((error, req, res, next) => {
    console.log(error)
    const status = error.statusCode || 500;
    const message = error.message
    const data = error.data
    res.status(status).json({
        status: false,
        message: message,
        data: {
            error: data
        }
    })
})

mongoose.connect(process.env.DB_URI).then(result => {
    const server = app.listen(process.env.PORT, () => {
        console.log('Server is running on port: ', process.env.PORT)
    })

    const io = require('./socket').init(server, {
        cors: corsOptions
    })
    io.on('connection', socket => {
        console.log('Client connected!')
        socket.on('join-room', (roomId) => {
            console.log('private room_id : ', roomId)
            socket.join(roomId)
        })
        socket.on('disconnect', () => console.log('Client disconnected!'))
    })

}).catch(error => {
    console.log('DB connection error: ', error)
})