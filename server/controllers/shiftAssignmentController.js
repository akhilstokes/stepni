const ShiftAssignment = require('../models/ShiftAssignment');
const Shift = require('../models/Shift');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Assign multiple staff to a shift
exports.assignStaffToShift = async (req, res) => {
  try {
    const { shiftId, staffIds, date } = req.body;

    // Validate inputs
    if (!shiftId || !staffIds || !Array.isArray(staffIds) || staffIds.length === 0 || !date) {
      return res.status(400).json({ 
        message: 'Shift ID, staff IDs array, and date are required' 
      });
    }

    // Validate shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Parse date
    const assignmentDate = new Date(date);
    assignmentDate.setHours(0, 0, 0, 0);

    const results = {
      success: [],
      failed: [],
      duplicates: [],
      conflicts: []
    };

    // Process each staff member
    for (const staffId of staffIds) {
      try {
        // Validate staff exists
        const staff = await User.findById(staffId);
        if (!staff) {
          results.failed.push({
            staffId,
            reason: 'Staff member not found'
          });
          continue;
        }

        // Check for duplicate assignment
        const existingAssignment = await ShiftAssignment.findOne({
          shift: shiftId,
          staff: staffId,
          date: assignmentDate
        });

        if (existingAssignment) {
          results.duplicates.push({
            staffId,
            staffName: staff.name,
            reason: 'Already assigned to this shift'
          });
          continue;
        }

        // Check for overlapping shifts on the same date
        const dayStart = new Date(assignmentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(assignmentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const existingAssignments = await ShiftAssignment.find({
          staff: staffId,
          date: { $gte: dayStart, $lte: dayEnd },
          status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
        }).populate('shift');

        // Check for time conflicts
        let hasConflict = false;
        let conflictDetails = null;

        for (const existing of existingAssignments) {
          if (existing.shift) {
            const conflict = checkTimeOverlap(
              shift.startTime,
              shift.endTime,
              existing.shift.startTime,
              existing.shift.endTime
            );

            if (conflict) {
              hasConflict = true;
              conflictDetails = {
                shiftName: existing.shift.name,
                time: `${existing.shift.startTime} - ${existing.shift.endTime}`
              };
              break;
            }
          }
        }

        if (hasConflict) {
          results.conflicts.push({
            staffId,
            staffName: staff.name,
            reason: `Conflicts with ${conflictDetails.shiftName} (${conflictDetails.time})`
          });
          continue;
        }

        // Create assignment
        const assignment = new ShiftAssignment({
          shift: shiftId,
          staff: staffId,
          date: assignmentDate,
          status: 'scheduled',
          createdBy: req.user.id
        });

        await assignment.save();

        results.success.push({
          staffId,
          staffName: staff.name,
          assignmentId: assignment._id
        });

      } catch (error) {
        results.failed.push({
          staffId,
          reason: error.message
        });
      }
    }

    // Prepare response
    const response = {
      message: `Assigned ${results.success.length} staff member(s) successfully`,
      summary: {
        total: staffIds.length,
        successful: results.success.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length,
        conflicts: results.conflicts.length
      },
      details: results
    };

    // Determine status code
    if (results.success.length === 0) {
      return res.status(400).json(response);
    } else if (results.success.length < staffIds.length) {
      return res.status(207).json(response); // Multi-status
    } else {
      return res.status(201).json(response);
    }

  } catch (error) {
    console.error('Error assigning staff to shift:', error);
    res.status(500).json({ 
      message: 'Error assigning staff to shift', 
      error: error.message 
    });
  }
};

// Helper function to check time overlap
function checkTimeOverlap(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Handle overnight shifts
  const e1Adjusted = e1 < s1 ? e1 + 1440 : e1;
  const e2Adjusted = e2 < s2 ? e2 + 1440 : e2;

  return (s1 < e2Adjusted && e1Adjusted > s2);
}

// Get staff assigned to a specific shift
exports.getStaffByShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { date, status } = req.query;

    const query = { shift: shiftId };
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    }
    
    if (status) {
      query.status = status;
    }

    const assignments = await ShiftAssignment.find(query)
      .populate('staff', 'name email phone staffId role')
      .populate('shift', 'name type startTime endTime category')
      .sort({ 'staff.name': 1 });

    res.json({
      count: assignments.length,
      assignments
    });

  } catch (error) {
    console.error('Error fetching staff by shift:', error);
    res.status(500).json({ 
      message: 'Error fetching staff assignments', 
      error: error.message 
    });
  }
};

// Get today's attendance based on assignments
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get all assignments for today
    const assignments = await ShiftAssignment.find({
      date: { $gte: today, $lte: todayEnd },
      status: { $in: ['scheduled', 'confirmed', 'in_progress', 'completed'] }
    })
      .populate('staff', 'name email phone staffId role')
      .populate('shift', 'name type startTime endTime category location')
      .sort({ 'shift.startTime': 1, 'staff.name': 1 });

    // Calculate attendance statistics
    const stats = {
      totalAssigned: assignments.length,
      present: 0,
      absent: 0,
      late: 0,
      onTime: 0
    };

    const attendanceList = assignments.map(assignment => {
      let status = 'absent';
      let checkInTime = null;
      let checkOutTime = null;
      let isLate = false;

      if (assignment.attendance.checkedIn) {
        status = assignment.attendance.checkedOut ? 'completed' : 'present';
        checkInTime = assignment.attendance.checkInTime;
        checkOutTime = assignment.attendance.checkOutTime;

        // Check if late
        if (assignment.actualStartTime) {
          const scheduledStart = new Date(assignment.date);
          const [hours, minutes] = assignment.shift.startTime.split(':');
          scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const lateMinutes = Math.floor((assignment.actualStartTime - scheduledStart) / (1000 * 60));
          isLate = lateMinutes > 15; // Consider late if more than 15 minutes
          
          if (isLate) {
            stats.late++;
          } else {
            stats.onTime++;
          }
        }

        stats.present++;
      } else {
        stats.absent++;
      }

      return {
        assignmentId: assignment._id,
        staff: {
          id: assignment.staff._id,
          name: assignment.staff.name,
          email: assignment.staff.email,
          staffId: assignment.staff.staffId,
          role: assignment.staff.role
        },
        shift: {
          id: assignment.shift._id,
          name: assignment.shift.name,
          type: assignment.shift.type,
          startTime: assignment.shift.startTime,
          endTime: assignment.shift.endTime,
          category: assignment.shift.category,
          location: assignment.shift.location
        },
        status,
        checkInTime,
        checkOutTime,
        isLate,
        assignmentStatus: assignment.status
      };
    });

    res.json({
      date: today.toISOString().split('T')[0],
      stats,
      attendance: attendanceList
    });

  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({ 
      message: 'Error fetching attendance', 
      error: error.message 
    });
  }
};

// Get available staff for assignment (not already assigned to overlapping shifts)
exports.getAvailableStaff = async (req, res) => {
  try {
    const { shiftId, date } = req.query;

    if (!shiftId || !date) {
      return res.status(400).json({ 
        message: 'Shift ID and date are required' 
      });
    }

    // Get the shift details
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    const assignmentDate = new Date(date);
    assignmentDate.setHours(0, 0, 0, 0);

    const dayStart = new Date(assignmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(assignmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Get all staff members (filter by role if needed)
    const allStaff = await User.find({
      role: { $in: ['user', 'labour', 'field_staff', 'delivery_staff', 'lab_staff'] }
    }).select('name email phone staffId role').sort({ name: 1 });

    // Get all assignments for this date
    const existingAssignments = await ShiftAssignment.find({
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    }).populate('shift');

    // Filter available staff
    const availableStaff = [];
    const unavailableStaff = [];

    for (const staff of allStaff) {
      // Check if already assigned to this specific shift
      const alreadyAssigned = existingAssignments.some(
        assignment => 
          assignment.staff.toString() === staff._id.toString() &&
          assignment.shift._id.toString() === shiftId
      );

      if (alreadyAssigned) {
        unavailableStaff.push({
          ...staff.toObject(),
          reason: 'Already assigned to this shift'
        });
        continue;
      }

      // Check for time conflicts
      const staffAssignments = existingAssignments.filter(
        assignment => assignment.staff.toString() === staff._id.toString()
      );

      let hasConflict = false;
      let conflictReason = '';

      for (const assignment of staffAssignments) {
        if (assignment.shift) {
          const conflict = checkTimeOverlap(
            shift.startTime,
            shift.endTime,
            assignment.shift.startTime,
            assignment.shift.endTime
          );

          if (conflict) {
            hasConflict = true;
            conflictReason = `Conflicts with ${assignment.shift.name} (${assignment.shift.startTime} - ${assignment.shift.endTime})`;
            break;
          }
        }
      }

      if (hasConflict) {
        unavailableStaff.push({
          ...staff.toObject(),
          reason: conflictReason
        });
      } else {
        availableStaff.push(staff);
      }
    }

    res.json({
      shift: {
        id: shift._id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime
      },
      date: assignmentDate.toISOString().split('T')[0],
      available: availableStaff,
      unavailable: unavailableStaff,
      stats: {
        totalStaff: allStaff.length,
        available: availableStaff.length,
        unavailable: unavailableStaff.length
      }
    });

  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({ 
      message: 'Error fetching available staff', 
      error: error.message 
    });
  }
};

// Remove staff from shift
exports.removeStaffFromShift = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await ShiftAssignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if already checked in
    if (assignment.attendance.checkedIn) {
      return res.status(400).json({ 
        message: 'Cannot remove staff who have already checked in' 
      });
    }

    await ShiftAssignment.findByIdAndDelete(assignmentId);

    res.json({ 
      message: 'Staff removed from shift successfully',
      assignmentId 
    });

  } catch (error) {
    console.error('Error removing staff from shift:', error);
    res.status(500).json({ 
      message: 'Error removing staff from shift', 
      error: error.message 
    });
  }
};

// Get shift assignments for a specific date range
exports.getAssignmentsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, shiftId, staffId } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (shiftId) query.shift = shiftId;
    if (staffId) query.staff = staffId;

    const assignments = await ShiftAssignment.find(query)
      .populate('shift', 'name type startTime endTime category color')
      .populate('staff', 'name email phone staffId')
      .sort({ date: 1, 'shift.startTime': 1 });

    res.json({
      count: assignments.length,
      assignments
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ 
      message: 'Error fetching assignments', 
      error: error.message 
    });
  }
};
