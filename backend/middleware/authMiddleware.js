const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';

// Verify Token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });
        next();
    });
};

module.exports = { authenticateToken, authenticateAdmin };
