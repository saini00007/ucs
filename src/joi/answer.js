import Joi from 'joi';
import { ANSWER_TYPES } from '../utils/constants';
const validAnswerValues = Object.values(ANSWER_TYPES);

const createAnswerSchema = Joi.object({
  answerText: Joi.string()
    .valid(...validAnswerValues)
    .insensitive()
    .required()
    .custom((value) => (typeof value === 'string' ? value.toLowerCase() : value), 'lowercase conversion')
    .messages({
      'any.only': 'Answer must be one of the following: yes, no, not applicable.',
      'string.empty': 'Answer text cannot be empty.',
      'any.required': 'Answer text is required.',
    }),
});

const updateAnswerSchema = createAnswerSchema.keys({
  commentText: Joi.string().allow('').optional().messages({
    'string.empty': 'Comment text cannot be empty.',
  }),
});

export { createAnswerSchema, updateAnswerSchema };
