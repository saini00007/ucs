const attachResourceInfo = (roleResourceType, contentResourceType, contentResourceIdKey, action) => {
    return (req, res, next) => {

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

        if (
            nullResourceIdMappings[roleResourceType] &&
            nullResourceIdMappings[roleResourceType][action] &&
            nullResourceIdMappings[roleResourceType][action].includes(contentResourceType)
        ) {
            req.contentResourceId = null;
        } else {
            if (req.params[contentResourceIdKey]) {
                req.contentResourceId = req.params[contentResourceIdKey];
            } else {
                req.contentResourceId = req.body[contentResourceIdKey];
            }
        }

        req.roleResourceType = roleResourceType;
        req.contentResourceType = contentResourceType;
        req.action = action.toLowerCase();

        return next();
    };
};

export default attachResourceInfo;
