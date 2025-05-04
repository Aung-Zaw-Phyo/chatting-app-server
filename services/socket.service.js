const { getIo } = require("../socket")

exports.emitMessage = (roomId, eventName, message, type) => {
    getIo().to(roomId).emit(eventName, {
        message: message,
        type: type
    })
}