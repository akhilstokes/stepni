const BarrelIssueRegister = require('../models/barrelIssueRegisterModel');
const Barrel = require('../models/barrelModel');
const BarrelRequest = require('../models/barrelRequestModel');
const User = require('../models/userModel');
const Notification = require('../models/Notification');

/**
 * Barrel Issue Register Controller
 * 
 * Handles all operations related to barrel issue/return transactions
 */

/**
 * WORKFLOW: Assign Barrels and Create Register Entries
 * 
 * This is the CORE function that creates register entries when admin assigns barrels
 * 
 * Steps:
 * 1. Validate all barrels are AVAILABLE
 * 2. Create ONE register entry per barrel
 * 3. Update barrel status to IN_USE
 * 4. Update request status to ASSIGNED
 * 5. Send notifications
 */
exports.assignBarrelsAndCreateRegister = async (req, res) => {
  const session = await BarrelIssueRegister.startSession();
  session.startTransaction();

  try {
    const { requestId, barrelIds, expectedReturnDays = 30, issueNotes } = req.body;
    const adminId = req.user._id;
    const adminName = req.user.name;

    // Step 1: Validate request exists
    const request = await BarrelRequest.findById(requestId)
      .populate('user', 'name email phoneNumber')
      .session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Barrel request not found' 
      });
    }

    // Step 2: Validate all barrels exist and are AVAILABLE
    const barrels = await Barrel.find({
      barrelId: { $in: barrelIds }
    }).session(session);

    if (barrels.length !== barrelIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Some barrels not found in inventory'
      });
    }

    const unavailableBarrels = barrels.filter(b => b.status !== 'available');
    if (unavailableBarrels.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Barrels not available: ${unavailableBarrels.map(b => b.barrelId).join(', ')}`
      });
    }

    // Step 3: Calculate expected return date
    const issueDate = new Date();
    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + expectedReturnDays);

    // Step 4: Create ONE register entry per barrel
    const registerEntries = [];
    
    for (const barrel of barrels) {
      const registerId = await BarrelIssueRegister.generateRegisterId();
      
      const registerEntry = new BarrelIssueRegister({
        registerId,
        requestId: request._id,
        userId: request.user._id,
        userNameSnapshot: request.user.name,
        userEmailSnapshot: request.user.email,
        barrelId: barrel.barrelId,
        barrelSnapshot: {
          type: barrel.type,
          capacity: barrel.capacity,
          material: barrel.material,
        },
        issueDate,
        expectedReturnDate,
        issuedByAdminId: adminId,
        issuedByAdminName: adminName,
        status: 'ISSUED',
        issueNotes: issueNotes || '',
        deliveryStaffId: request.deliveryStaff,
        deliveryDate: request.deliveryDate,
        deliveryLocation: request.deliveryLocation,
      });

      await registerEntry.save({ session });
      registerEntries.push(registerEntry);

      // Step 5: Update barrel status to IN_USE
      barrel.status = 'in-use';
      barrel.assignedTo = request.user._id;
      barrel.assignedDate = issueDate;
      await barrel.save({ session });
    }

    // Step 6: Update request status to ASSIGNED
    request.status = 'assigned';
    request.assignedBarrels = barrelIds;
    request.assignedAt = issueDate;
    await request.save({ session });

    // Step 7: Send notification to user
    try {
      await Notification.create([{
        userId: request.user._id,
        role: 'user',
        title: '📦 Barrels Issued to You',
        message: `${barrelIds.length} barrel(s) have been issued to you. Please return by ${expectedReturnDate.toLocaleDateString('en-GB')}. Barrel IDs: ${barrelIds.join(', ')}`,
        read: false,
      }], { session });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: `Successfully issued ${barrelIds.length} barrel(s) and created register entries`,
      registerEntries: registerEntries.map(r => ({
        registerId: r.registerId,
        barrelId: r.barrelId,
        issueDate: r.issueDate,
        expectedReturnDate: r.expectedReturnDate,
      })),
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error assigning barrels:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * WORKFLOW: Return Barrels and Update Register
 * 
 * Steps:
 * 1. Validate register entries exist and are ISSUED/OVERDUE
 * 2. Update register entries with return information
 * 3. Update barrel status back to AVAILABLE
 * 4. Calculate penalties if overdue
 */
exports.returnBarrels = async (req, res) => {
  const session = await BarrelIssueRegister.startSession();
  session.startTransaction();

  try {
    const { registerIds, returnCondition = 'GOOD', returnNotes } = req.body;
    const adminId = req.user._id;
    const adminName = req.user.name;
    const returnDate = new Date();

    // Step 1: Find all register entries
    const registerEntries = await BarrelIssueRegister.find({
      registerId: { $in: registerIds }
    }).session(session);

    if (registerEntries.length !== registerIds.length) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Some register entries not found'
      });
    }

    // Step 2: Validate all are ISSUED or OVERDUE
    const invalidEntries = registerEntries.filter(
      r => !['ISSUED', 'OVERDUE'].includes(r.status)
    );

    if (invalidEntries.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Some barrels already returned: ${invalidEntries.map(r => r.barrelId).join(', ')}`
      });
    }

    // Step 3: Update register entries
    const updatedEntries = [];
    
    for (const entry of registerEntries) {
      entry.actualReturnDate = returnDate;
      entry.status = 'RETURNED';
      entry.returnCondition = returnCondition;
      entry.returnNotes = returnNotes || '';
      entry.returnedByAdminId = adminId;
      entry.returnedByAdminName = adminName;
      
      // Calculate penalty if overdue
      const daysOverdue = entry.calculateDaysOverdue();
      if (daysOverdue > 0) {
        entry.daysOverdue = daysOverdue;
        entry.penaltyAmount = daysOverdue * 10; // $10 per day overdue
      }

      await entry.save({ session });
      updatedEntries.push(entry);

      // Step 4: Update barrel status back to AVAILABLE
      const barrel = await Barrel.findOne({ barrelId: entry.barrelId }).session(session);
      if (barrel) {
        barrel.status = 'available';
        barrel.assignedTo = null;
        barrel.assignedDate = null;
        await barrel.save({ session });
      }
    }

    // Step 5: Notify user
    if (registerEntries.length > 0) {
      const userId = registerEntries[0].userId;
      try {
        await Notification.create([{
          userId: userId,
          role: 'user',
          title: '✅ Barrels Returned Successfully',
          message: `${registerEntries.length} barrel(s) have been returned. Thank you!`,
          read: false,
        }], { session });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: `Successfully returned ${registerEntries.length} barrel(s)`,
      returnedEntries: updatedEntries.map(r => ({
        registerId: r.registerId,
        barrelId: r.barrelId,
        daysOverdue: r.daysOverdue,
        penaltyAmount: r.penaltyAmount,
      })),
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error returning barrels:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all register entries (with filters)
 */
exports.getAllRegisterEntries = async (req, res) => {
  try {
    const { status, userId, barrelId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (barrelId) filter.barrelId = barrelId;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      BarrelIssueRegister.find(filter)
        .populate('userId', 'name email phoneNumber')
        .populate('issuedByAdminId', 'name')
        .populate('returnedByAdminId', 'name')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BarrelIssueRegister.countDocuments(filter),
    ]);

    res.json({
      success: true,
      entries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching register entries:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get overdue issues
 */
exports.getOverdueIssues = async (req, res) => {
  try {
    const overdueEntries = await BarrelIssueRegister.findOverdueIssues();

    // Update status to OVERDUE
    for (const entry of overdueEntries) {
      if (entry.status === 'ISSUED') {
        entry.status = 'OVERDUE';
        entry.daysOverdue = entry.calculateDaysOverdue();
        await entry.save();
      }
    }

    res.json({
      success: true,
      overdueCount: overdueEntries.length,
      entries: overdueEntries,
    });

  } catch (error) {
    console.error('Error fetching overdue issues:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's active issues
 */
exports.getUserActiveIssues = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const activeIssues = await BarrelIssueRegister.getUserActiveIssues(userId);

    res.json({
      success: true,
      count: activeIssues.length,
      issues: activeIssues,
    });

  } catch (error) {
    console.error('Error fetching user active issues:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get barrel history
 */
exports.getBarrelHistory = async (req, res) => {
  try {
    const { barrelId } = req.params;

    const history = await BarrelIssueRegister.getBarrelHistory(barrelId);

    res.json({
      success: true,
      barrelId,
      historyCount: history.length,
      history,
    });

  } catch (error) {
    console.error('Error fetching barrel history:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get register statistics
 */
exports.getRegisterStatistics = async (req, res) => {
  try {
    const [
      totalIssued,
      totalReturned,
      totalOverdue,
      totalPenalties,
    ] = await Promise.all([
      BarrelIssueRegister.countDocuments({ status: 'ISSUED' }),
      BarrelIssueRegister.countDocuments({ status: 'RETURNED' }),
      BarrelIssueRegister.countDocuments({ status: 'OVERDUE' }),
      BarrelIssueRegister.aggregate([
        { $match: { penaltyAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$penaltyAmount' } } },
      ]),
    ]);

    res.json({
      success: true,
      statistics: {
        totalIssued,
        totalReturned,
        totalOverdue,
        totalPenalties: totalPenalties[0]?.total || 0,
        activeIssues: totalIssued + totalOverdue,
      },
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
