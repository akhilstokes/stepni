 
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes for logged-in users
exports.protect = async (req, res, next) => {
    let token;
    
    // Check if authorization header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Check if token exists and is not empty
            if (!token || token.trim() === '') {
                return res.status(401).json({ message: 'Not authorized, no token provided' });
            }
            
            // Basic token format validation (JWT should have 3 parts separated by dots)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Malformed JWT token - incorrect number of parts:', tokenParts.length);
                return res.status(401).json({ message: 'Invalid token format' });
            }
            
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Support built-in admin token (id: 'builtin-admin')
            if (decoded && decoded.id === 'builtin-admin') {
                req.user = { _id: 'builtin-admin', name: 'Admin', email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@xyz.com', role: 'admin' };
                return next();
            }
            // Support built-in manager token (id: 'builtin-manager')
            if (decoded && decoded.id === 'builtin-manager') {
                req.user = { _id: 'builtin-manager', name: 'Manager', email: process.env.DEFAULT_MANAGER_EMAIL || 'manger@xyz.com', role: 'manager' };
                return next();
            }
            // Support built-in delivery staff token (id: 'builtin-delivery')
            if (decoded && decoded.id === 'builtin-delivery') {
                // Try to resolve to a real DB user to ensure a valid ObjectId downstream
                let userDoc = null;
                const email = process.env.DEFAULT_DELIVERY_EMAIL || 'delivery+builtin@local';
                const staffId = process.env.DEFAULT_DELIVERY_STAFFID || 'STF-2025-005';
                userDoc = await User.findOne({ email }).select('-password');
                if (!userDoc) userDoc = await User.findOne({ role: 'delivery_staff' }).select('-password');
                if (!userDoc) {
                    // Auto-provision a minimal user
                    try {
                        userDoc = await User.create({
                            name: 'Delivery Staff',
                            email,
                            role: 'delivery_staff',
                            staffId
                        });
                    } catch (_) { /* ignore creation errors */ }
                }
                if (userDoc) { req.user = userDoc; return next(); }
                // Fallback placeholder
                req.user = { _id: 'builtin-delivery', staffId, name: 'Delivery Staff', email, role: 'delivery_staff' };
                return next();
            }
            // Support built-in accountant token (id: 'builtin-accountant')
            if (decoded && decoded.id === 'builtin-accountant') {
                let userDoc = null;
                const email = process.env.DEFAULT_ACCOUNTANT_EMAIL || 'accountant+builtin@local';
                const staffId = process.env.DEFAULT_ACCOUNTANT_STAFFID || 'ACC01';
                userDoc = await User.findOne({ email }).select('-password');
                if (!userDoc) userDoc = await User.findOne({ role: 'accountant' }).select('-password');
                if (!userDoc) {
                    try {
                        userDoc = await User.create({
                            name: 'Accountant',
                            email,
                            role: 'accountant',
                            staffId
                        });
                    } catch (_) { /* ignore creation errors */ }
                }
                if (userDoc) { req.user = userDoc; return next(); }
                req.user = { _id: 'builtin-accountant', staffId, name: 'Accountant', email, role: 'accountant' };
                return next();
            }
            
            // Check if user exists
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            console.error('Token received:', token ? `${token.substring(0, 20)}...` : 'null');
            
            // Handle specific JWT errors
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token format' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            } else {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Protect routes for admin users only
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

exports.adminOrManager = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized. Manager or Admin required.' });
};

exports.adminManagerAccountant = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'accountant')) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized. Admin, Manager, or Accountant required.' });
};

// Allow only Lab staff
exports.labOnly = (req, res, next) => {
    if (req.user && req.user.role === 'lab') {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized. Lab staff required.' });
};

// Allow Lab staff or Admin
exports.labOrAdminMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'lab' || req.user.role === 'lab_staff' || req.user.role === 'lab_manager' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized. Lab staff or Admin required.' });
};

// Allow Field staff (mapped as delivery_staff or field)
exports.fieldOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'delivery_staff' || req.user.role === 'field')) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized. Field staff required.' });
};

// Generic authorize function for role-based access control
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user found' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Not authorized. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}` 
            });
        }
        
        next();
    };
};