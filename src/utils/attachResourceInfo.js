const attachResourceInfo = (roleResourceType, contentResourceType, contentResourceIdKey, action) => {
    return (req, res, next) => {
        // Mapping for cases where specific resource types and actions should result in a null contentResourceId.
        const nullResourceIdMappings = {
            'Company': {
                'list': ['Company'],
                'create': ['Company'],
            },
            'MasterQuestion': {
                'list': ['MasterQuestion'],
            },
            'MasterDepartment': {
                'list': ['MasterDepartment'],
            },
            'Role': {
                'list': ['Role'],
            },
        };

        // Check if the combination of roleResourceType, action, and contentResourceType exists in the nullResourceIdMappings.
        if (
            nullResourceIdMappings[roleResourceType] &&
            nullResourceIdMappings[roleResourceType][action] &&
            nullResourceIdMappings[roleResourceType][action].includes(contentResourceType)
        ) {
            // If it exists, set contentResourceId to null.
            req.contentResourceId = null;
        } else {
            // Otherwise, attempt to get the contentResourceId from request parameters.
            if (req.params[contentResourceIdKey]) {
                req.contentResourceId = req.params[contentResourceIdKey];
            } else {
                // If not found in parameters, attempt to get it from the request body.
                req.contentResourceId = req.body[contentResourceIdKey];
            }
        }

        // Set additional information on the request object for use in later middleware or route handlers.
        req.roleResourceType = roleResourceType;
        req.contentResourceType = contentResourceType;
        req.actionType = action.toLowerCase();

        return next();
    };
};

export default attachResourceInfo;
