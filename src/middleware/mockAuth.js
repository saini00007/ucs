// src/middleware/mockAuth.js

// Fake auth for development -- will change soon
const mockUser = {
    userId: 'abcd12345678',
    username: 'superAdmin',
    role_id: '1',
};

// Correctly export the mockAuthenticate function as the default export
const mockAuthenticate = (req, res, next) => {
    // Simulate user authentication and set req.user
    req.user = mockUser;
    next(); // Proceed to the next middleware or route handler
};

export default mockAuthenticate; // Ensure this is correct
