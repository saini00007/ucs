// mockAuthenticate.js
const mockUsers = {
    admin: {
        id: 'abcd12345678',
        username: 'adminUser',
        roleId: 'admin',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: null
    },
    superadmin: {
        id: 'abcd87654321',
        username: 'superAdminUser',
        roleId: 'superadmin',
        companyId: null,
        departmentId: null
    },
    guestUser: {
        id: 'guest12345678',
        username: 'guestUser',
        roleId: 'guest',
        companyId: 'f10e2bb9-af6b-448e-b1b7-bd776c208c94',
        departmentId: 'eb2851cc-a2f9-45e7-bb0b-4db3c7065eca'
    }
};

const setMockUser = (userType) => {
    return mockUsers[userType] || mockUsers['guestUser'];
};

const mockAuthenticate = (req, res, next) => {
    const userType = 'admin';
    req.user = setMockUser(userType);
    next();
};

export default mockAuthenticate;
