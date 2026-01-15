const express = require('express');
const router = express.Router();
const fieldStaffController = require('../controllers/fieldStaffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes - field staff and regular staff can access
router.use(protect);
router.use(authorize('field_staff', 'staff'));

// Dashboard routes
router.get('/stats/today', fieldStaffController.getDashboardStats);
router.get('/activity/recent', fieldStaffController.getRecentActivity);

// Barrel management routes
router.post('/barrel-update', fieldStaffController.updateBarrelStatus);

// Route management
router.get('/routes', fieldStaffController.getRoutes);

// Reports
router.get('/reports', fieldStaffController.getReports);
router.post('/reports', fieldStaffController.createReport);

// Profile management
router.put('/profile', fieldStaffController.updateProfile);

// Return barrel routes
router.post('/return-barrels', fieldStaffController.submitReturnBarrels);
router.post('/request-barrel-ids', fieldStaffController.requestBarrelIds);
router.get('/return-requests', fieldStaffController.getReturnBarrelRequests);

module.exports = router;