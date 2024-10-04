// middleware/authMiddleware.js

const mockUser = {
    userId: 1, // Example user ID
    username: 'superAdmin',
};

export const mockAuthenticate = (req, res, next) => {
    // Simulate user authentication and set req.user
    req.user = mockUser; 
    next(); // Proceed to the next middleware or route handler
};
