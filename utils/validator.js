const ObjectId = require("mongoose").Types.ObjectId;
exports.validateMongoId = (req, res, next) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            const error = new Error('Invalid Id')
            error.statusCode = 403
            throw error
        } else {
            next();
        }
    } catch (error) {
        next(error)
    }
};