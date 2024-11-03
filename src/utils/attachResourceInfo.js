const attachResourceInfo = (roleResourceType, contentResourceType, contentResourceIdKey, action) => (req, res, next) => {

    const actionPermissions = {
        list: ['Company', 'MasterQuestion', 'MasterDepartment','Role'],
        create: ['Company'],
    };
    if (actionPermissions[action] && actionPermissions[action].includes(contentResourceType)) {
        req.roleResourceType = roleResourceType;
        req.contentResourceType = contentResourceType;
        req.contentResourceId = null;
        req.action = action.toLowerCase();
        return next();
    }

    if (!req.params[contentResourceIdKey] || !roleResourceType || !contentResourceType || !action) {
        return res.status(400).json({
            success: false,
            message: `Bad Request: Missing parameter(s). Required: '${contentResourceIdKey}', 'roleResourceType', 'contentResourceType', 'action'.`
        });
    }

    req.roleResourceType = roleResourceType;
    req.contentResourceType = contentResourceType;
    req.contentResourceId = req.params[contentResourceIdKey];
    req.action = action.toLowerCase();

    next();
};

export default attachResourceInfo;
