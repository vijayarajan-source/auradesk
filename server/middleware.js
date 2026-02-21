const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./routes/auth');

function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = requireAuth;
