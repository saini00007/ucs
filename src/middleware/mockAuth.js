const mockUsers = {
    superadmin: {
        id: 'abcd12345678',
        username: 'superAdminUser',
        roleId: 'superadmin',
        companyId: null,
        departmentId: null
    },
    admin: {
        id: 'abcd12345679',
        username: 'adminUser',
        roleId: 'admin',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: null
    },
    departmentManager: {
        id: 'abcd12345680',
        username: 'deptManagerUser',
        roleId: 'departmentmanager',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: 'eb2851cc-a2f9-45e7-bb0b-4db3c7065eca'
    },
    assessor: {
        id: 'abcd12345681',
        username: 'assessorUser',
        roleId: 'assessor',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: 'eb2851cc-a2f9-45e7-bb0b-4db3c7065eca'
    },
    reviewer: {
        id: 'abcd12345682',
        username: 'reviewerUser',
        roleId: 'reviewer',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: 'eb2851cc-a2f9-45e7-bb0b-4db3c7065eca'
    }
};

const setMockUser = (userType) => {
    return mockUsers[userType] || mockUsers['guestUser'];
}; 

const mockAuthenticate = (req, res, next) => {
    const userType = 'superadmin';
    req.user = setMockUser(userType);
    next();
};

export default mockAuthenticate;
