const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const path = require('path')
const app = express()
const PORT = 5000

const chat_auth_route = require('./routes/auth_route')
const chat_private_route = require('./routes/private_route')
const chat_group_route = require('./routes/group_route')
const chat_admin_route = require('./routes/admin_route')

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // ['http://localhost:3000', 'http://localhost:3001']
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

app.get('/', (req, res, next) => {
    res.status(200).send('Server is running on port: ' + PORT)
})

app.use('/chat', chat_auth_route)
app.use('/chat/private', chat_private_route)
app.use('/chat/group', chat_group_route)
app.use('/chat/admin', chat_admin_route)



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

mongoose.connect('mongodb://127.0.0.1:27017/projects').then(result => {
    const server = app.listen(PORT, () => {
        console.log('Server is running on port: ', PORT)
    })

    const io = require('./socket').init(server)
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