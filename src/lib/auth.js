const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'susvada-jwt-secret';
const TOKEN_EXPIRY = '7d';

function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
}

function requireAuth(request) {
    const user = getUserFromRequest(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

function requireAdmin(request) {
    const user = requireAuth(request);
    if (user.role !== 'admin') {
        throw new Error('Forbidden');
    }
    return user;
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    getUserFromRequest,
    requireAuth,
    requireAdmin,
};
