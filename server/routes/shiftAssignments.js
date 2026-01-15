const express = require('express');
const router = express.Router();
const shiftAssignmentController = require('../controllers/shiftAssignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Assign multiple staff to a shift
router.post('/assign', protect, authorize('manager', 'admin'), shiftAssignmentController.assignStaffToShift);

// Get available staff for assignment
router.get('/available-staff', protect, authorize('manager', 'admin'), shiftAssignmentController.getAvailableStaff);

// Get today's attendance based on assignments
router.get('/today-attendance', protect, shiftAssignmentController.getTodayAttendance);

// Get staff assigned to a specific shift
router.get('/shift/:shiftId', protect, shiftAssignmentController.getStaffByShift);

// Get assignments by date range
router.get('/date-range', protect, shiftAssignmentController.getAssignmentsByDateRange);

// Remove staff from shift
router.delete('/:assignmentId', protect, authorize('manager', 'admin'), shiftAssignmentController.removeStaffFromShift);

// Legacy routes (keep for backward compatibility)
// Get shift assignments
router.get('/', protect, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      staff,
      shift,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (staff) query.staff = staff;
    if (shift) query.shift = shift;
    if (status) query.status = status;

    const assignments = await ShiftAssignment.find(query)
      .populate('shift', 'name type startTime endTime category color')
      .populate('staff', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ date: -1, 'shift.startTime': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ShiftAssignment.countDocuments(query);

    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching shift assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Get assignment by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await ShiftAssignment.findById(req.params.id)
      .populate('shift')
      .populate('staff', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('overtime.approvedBy', 'name email')
      .populate('performance.ratedBy', 'name email')
      .populate('replacement.originalStaff', 'name email')
      .populate('replacement.replacementStaff', 'name email')
      .populate('replacement.replacedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
});

// Create shift assignment
router.post('/', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { shift: shiftId, staff: staffId, date } = req.body;

    // Validate shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Validate staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const assignmentData = {
      ...req.body,
      createdBy: req.user.id
    };

    const assignment = new ShiftAssignment(assignmentData);
    await assignment.save();

    const populatedAssignment = await ShiftAssignment.findById(assignment._id)
      .populate('shift', 'name type startTime endTime category')
      .populate('staff', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// Update shift assignment
router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const assignment = await ShiftAssignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('shift', 'name type startTime endTime category')
      .populate('staff', 'name email phone')
      .populate('updatedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Delete shift assignment
router.delete('/:id', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const assignment = await ShiftAssignment.findByIdAndDelete(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
});

module.exports = router;