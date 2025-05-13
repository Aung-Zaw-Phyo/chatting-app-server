let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: { 
                origin: [process.env.FRONTEND_URL]
            }
        })
        return io
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket is not initialized!')
        }
        return io
    }
}