import Joi from 'joi';

// Middleware for validating request bodies against a provided Joi schema.
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(422).json({ success: false, message: errors });
    }
    next();
};

export default validate;
