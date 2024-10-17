
const mockUser = {
    userId: 'abcd12345678', 
    username: 'superAdmin',
    roleId: 1, 
    companyId: 1 
};

const mockAuthenticate = (req, res, next) => {
    req.user = mockUser;
    next(); 
};

export default mockAuthenticate;
