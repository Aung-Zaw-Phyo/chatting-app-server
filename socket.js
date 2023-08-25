let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: { 
                origin: ['http://localhost:3000', 'http://localhost:3001']
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