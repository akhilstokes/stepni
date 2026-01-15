const express = require('express');
const router = express.Router();
const returnBarrelController = require('../controllers/returnBarrelController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Field Staff Routes
router.post('/scan-qr', protect, returnBarrelController.scanBarrelQR);
router.post('/request-qr', protect, returnBarrelController.requestNewQR);
router.get('/my-qr-requests', protect, returnBarrelController.getMyQRRequests);
router.post('/confirm-qr-attachment', protect, returnBarrelController.confirmQRAttachment);
router.post('/add-to-hanger', protect, returnBarrelController.addBarrelToHanger);

// Admin Routes
router.get('/qr-requests', protect, authorize('admin', 'manager'), returnBarrelController.getPendingQRRequests);
router.post('/qr-requests/:requestId/approve', protect, authorize('admin', 'manager'), returnBarrelController.approveAndGenerateQR);
router.post('/qr-requests/:requestId/reject', protect, authorize('admin', 'manager'), returnBarrelController.rejectQRRequest);
router.post('/assign-to-customer', protect, authorize('admin', 'manager'), returnBarrelController.assignBarrelToCustomer);

// Common Routes
router.get('/hanger-spaces', protect, returnBarrelController.getHangerSpaces);
router.get('/barrel/:barrelId', protect, returnBarrelController.getBarrelDetails);
router.get('/dashboard-stats', protect, returnBarrelController.getDashboardStats);

module.exports = router;
