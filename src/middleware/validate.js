import Joi from 'joi';

const validate = (schema) => (req, res, next) => {
    try {
        console.log(req.body);
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(422).json({ success: false, messages: errors });
        }
        return next();
    } catch (err) {
        console.error('Validation error:', err);

        return res.status(500).json({
            success: false,
            messages: ['Internal Servor Error']
        });
    }
};

export default validate;