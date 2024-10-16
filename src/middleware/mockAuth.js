// src/middleware/mockAuth.js

// Fake auth for development -- will change soon
const mockUser = {
    user_id: '137131468915',
    username: 'superAdmin',
    role_id: 1,
};

const mockAuthenticate = (req, res, next) => {
    req.user = mockUser;
    next(); 
};

export default mockAuthenticate; // Ensure this is correct
