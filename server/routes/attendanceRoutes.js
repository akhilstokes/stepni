const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, admin, adminOrManager, adminManagerAccountant } = require('../middleware/authMiddleware');

// RFID attendance endpoint (no auth - called by Arduino)
router.post('/rfid', attendanceController.rfidAttendance);

// Staff routes (all authenticated users can mark attendance and view their own)
router.get('/shift', protect, attendanceController.getUserShift);
router.get('/today', protect, attendanceController.getTodayAttendance);
router.post('/mark', protect, attendanceController.markAttendance);
router.get('/history', protect, attendanceController.getAttendanceHistory);

// Manager/Admin/Accountant routes - MUST come before parameterized routes
router.get('/all', protect, adminManagerAccountant, attendanceController.getAllAttendance);
router.get('/today-all', protect, adminManagerAccountant, attendanceController.getTodayAttendanceAll);
router.get('/analytics', protect, adminManagerAccountant, attendanceController.getAttendanceAnalytics);
router.get('/summary/week', protect, adminManagerAccountant, attendanceController.getWeeklySummary);
router.post('/admin/mark', protect, adminManagerAccountant, attendanceController.adminMarkAttendance);
router.get('/staff/:staffId', protect, adminOrManager, attendanceController.getStaffAttendance);

// Legacy route for listing
router.get('/', protect, adminOrManager, attendanceController.getAttendance);
router.post('/', protect, adminOrManager, attendanceController.createAttendance);

// Parameterized routes - MUST come LAST to avoid catching specific routes
router.post('/:id/approve', protect, adminManagerAccountant, attendanceController.approveAttendance);
router.put('/:id/verify', protect, adminOrManager, attendanceController.verifyAttendance);
router.get('/:id', protect, adminOrManager, attendanceController.getAttendanceById);
router.put('/:id', protect, adminOrManager, attendanceController.updateAttendance);
router.delete('/:id', protect, admin, attendanceController.deleteAttendance);

module.exports = router;
