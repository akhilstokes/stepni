const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  assignBarrelsAndCreateRegister,
  returnBarrels,
  getAllRegisterEntries,
  getOverdueIssues,
  getUserActiveIssues,
  getBarrelHistory,
  getRegisterStatistics,
} = require('../controllers/barrelIssueRegisterController');

/**
 * Barrel Issue Register Routes
 * 
 * All routes require authentication
 * Admin-only routes are marked with admin middleware
 */

// POST /api/barrel-register/assign
// Assign barrels and create register entries (ADMIN ONLY)
router.post('/assign', protect, admin, assignBarrelsAndCreateRegister);

// POST /api/barrel-register/return
// Return barrels and update register (ADMIN ONLY)
router.post('/return', protect, admin, returnBarrels);

// GET /api/barrel-register
// Get all register entries with filters (ADMIN ONLY)
router.get('/', protect, admin, getAllRegisterEntries);

// GET /api/barrel-register/overdue
// Get all overdue issues (ADMIN ONLY)
router.get('/overdue', protect, admin, getOverdueIssues);

// GET /api/barrel-register/user/:userId/active
// Get user's active issues (ADMIN or OWN USER)
router.get('/user/:userId/active', protect, getUserActiveIssues);

// GET /api/barrel-register/user/my-active
// Get logged-in user's active issues
router.get('/user/my-active', protect, getUserActiveIssues);

// GET /api/barrel-register/barrel/:barrelId/history
// Get barrel's complete history (ADMIN ONLY)
router.get('/barrel/:barrelId/history', protect, admin, getBarrelHistory);

// GET /api/barrel-register/statistics
// Get register statistics (ADMIN ONLY)
router.get('/statistics', protect, admin, getRegisterStatistics);

module.exports = router;
