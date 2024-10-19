import Joi from 'joi';

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ success: false, message:errors });
    }

    next();
};

export default validate;
