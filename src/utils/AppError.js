class AppError extends Error {
    constructor(messages, statusCode = 500) {
        //can handle both single message as well as array of messages
        super(Array.isArray(messages) ? messages.join(', ') : messages);
        // If a single message is passed, make it an array
        this.messages = Array.isArray(messages) ? messages : [messages];

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Capture the stack trace to provide detailed error context
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
