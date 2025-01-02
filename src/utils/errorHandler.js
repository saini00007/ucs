// middleware/errorHandler.js
import AppError from '../utils/AppError.js';

const errorHandler = (err, req, res, next) => {

    // console.error({
    //     error: err,
    //     path: req.path,
    //     method: req.method,
    //     timestamp: new Date().toISOString()
    // });

    console.log(err.message);

    // Check if error is AppError instance
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            messages: [...err.messages] //consistent with the response structure
        });
    }

    // Handle any other errors
    return res.status(500).json({
        success: false,
        messages: ['Internal Server Error']
    });
};

export default errorHandler;