import AppError from '../utils/AppError.js';

const attachResourceInfo = (roleResourceType, contentResourceType, contentResourceId, actionId) => {
    return (req, res, next) => {
        try {
            if (!contentResourceId) {
                req.contentResourceId = null;
            } else {
                // Otherwise, attempt to get the contentResourceId from request parameters.
                if (req.params[contentResourceId]) {
                    req.contentResourceId = req.params[contentResourceId];
                } else {
                    // If not found in parameters, attempt to get it from the request body.
                    req.contentResourceId = req.body[contentResourceId];
                }
            }
            // Set additional information on the request object for use in later middleware or route handlers.
            req.roleResourceType = roleResourceType;
            req.contentResourceType = contentResourceType;
            req.actionId = actionId.toLowerCase();
            //req.user.roleId = 'superadmin'
            return next();

        } catch (error) {
            // Using AppError for structured error handling
            console.error('Error in attachResourceInfo middleware:', error);
            return next(error);
        }
    };
};

export default attachResourceInfo;
