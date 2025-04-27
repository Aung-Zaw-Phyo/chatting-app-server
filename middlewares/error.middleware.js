const errorMiddleware = (err, req, res, next) => {
    try {
        const error = {...err}
        error.message = err.message;

        console.err(err);

        // Mongoose bad ObjectId
        if(err.name === 'CastError') {
            const message = 'Resource not found';
            error = new Error(message);
            error.statusCode = 404;
        }

        // Mongoose duplicate key
        if(err.code === 11000) {
            const message = 'Duplicated field value entered';
            error = new Error(message);
            error.statusCode = 400;
        }

        // Mongoose validation error 
        if(err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            error = new Error(message.join(', '));
            error.statusCode = 422;
        }

        res.status(error.statusCode || 500).json({success: false, message: error.message || 'Server Error'});
    } catch (error) {
        next(error);
    }
}

export default errorMiddleware;