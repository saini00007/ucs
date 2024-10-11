//fake auth for development --will change soon
const mockUser = {
    userId: 1,
    username: 'superAdmin',
    role_id:'1'
};

export const mockAuthenticate = (req, res, next) => {
    // Simulate user authentication and set req.user
    req.user = mockUser; 
    next(); // Proceed to the next middleware or route handler
};
