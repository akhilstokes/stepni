const express = require('express');
const router = express.Router();
const adminReturnBarrelController = require('../controllers/adminReturnBarrelController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes - only admin can access
router.use(protect);
router.use(authorize('admin', 'manager'));

// Get all return barrel requests
router.get('/requests', adminReturnBarrelController.getAllReturnBarrelRequests);

// Approve barrel ID request
router.post('/requests/:requestId/approve', adminReturnBarrelController.approveBarrelIdRequest);

// Reject barrel ID request
router.post('/requests/:requestId/reject', adminReturnBarrelController.rejectBarrelIdRequest);

// Complete return barrel request
router.post('/requests/:requestId/complete', adminReturnBarrelController.completeReturnBarrelRequest);

module.exports = router;
