const User = require('../models/userModel');
const StaffSchedule = require('../models/staffScheduleModel');

// Bulk assign schedules to staff
exports.bulkAssignSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;
    const managerId = req.user.id;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Schedules array is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const schedule of schedules) {
      try {
        const { staffId, date, shift } = schedule;

        // Validate staff exists
        const staff = await User.findById(staffId);
        if (!staff) {
          errors.push({ staffId, error: 'Staff not found' });
          continue;
        }

        // Check if schedule already exists for this date
        const existing = await StaffSchedule.findOne({
          staffId,
          date: new Date(date)
        });

        if (existing) {
          // Update existing schedule
          existing.shift = shift;
          existing.assignedBy = managerId;
          existing.updatedAt = new Date();
          await existing.save();
          results.push({ staffId, action: 'updated', schedule: existing });
        } else {
          // Create new schedule
          const newSchedule = new StaffSchedule({
            staffId,
            staffName: staff.name,
            staffRole: staff.role,
            date: new Date(date),
            shift,
            assignedBy: managerId,
            status: 'assigned'
          });
          await newSchedule.save();
          results.push({ staffId, action: 'created', schedule: newSchedule });
        }
      } catch (err) {
        errors.push({ staffId: schedule.staffId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${results.length} schedules`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk assigning schedules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to assign schedules' 
    });
  }
};

// Get schedules by date range
exports.getSchedulesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    const schedules = await StaffSchedule.find(query)
      .populate('staffId', 'name email phoneNumber role')
      .populate('assignedBy', 'name')
      .sort({ date: 1, staffName: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch schedules' 
    });
  }
};

// Get schedule for specific staff
exports.getStaffSchedule = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { staffId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await StaffSchedule.find(query)
      .populate('assignedBy', 'name')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch staff schedule' 
    });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await StaffSchedule.findByIdAndDelete(scheduleId);
    if (!schedule) {
      return res.status(404).json({ 
        success: false,
        message: 'Schedule not found' 
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete schedule' 
    });
  }
};
