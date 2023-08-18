const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const socketIo = require("socket.io")
const PORT = 5000

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000"
    }
}) //in case server and client run on different urls

io.on("connection", (socket) => {
    console.log("client connected: ", socket.id)

    socket.join("clock-room")

    socket.on("disconnect", (reason) => {
        console.log(reason)
    })
})

setInterval(() => {
    io.to("clock-room").emit("time", new Date())
}, 1000)

app.get('/', (req, res, next) => {
    res.send('Hello')
})

server.listen(PORT, () => {
    console.log('Server is running on port: ', PORT)
})