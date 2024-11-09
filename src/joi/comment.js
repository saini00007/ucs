import Joi from 'joi';

const commentSchema = Joi.object({
    commentText: Joi.string()
        .trim()
        .min(1)
        .required()
        .messages({
            'string.base': '"commentText" must be a string',
            'string.empty': 'Comment can\'t be empty',
            'any.required': '"commentText" is required',
        }),
});

export default commentSchema;
