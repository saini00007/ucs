import AppError from "../utils/AppError";
const validate = (schema) => (req, res, next) => {
    console.log(req.body)
    try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => detail.message);
            throw new AppError(errors, 422);
        }
        next();
    } catch (error) {
        next(error);
    }
};
export default validate;