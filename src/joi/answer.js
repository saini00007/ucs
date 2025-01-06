import Joi from 'joi';
import { ANSWER_TYPES } from '../utils/constants';
const validAnswerValues = Object.values(ANSWER_TYPES);

const createAnswerSchema = Joi.object({
  answerText: Joi.string()
    .valid(...validAnswerValues)
    .insensitive()
    .required()
    .custom((value, helpers) => {
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
      return value;
    }, 'lowercase conversion')
    .messages({
      'any.only': 'Answer must be one of the following: yes, no, not applicable.',
      'string.empty': 'Answer text cannot be empty.',
      'any.required': 'Answer text is required.',
    }),

});
const updateAnswerSchema = createAnswerSchema;

export { createAnswerSchema, updateAnswerSchema };
