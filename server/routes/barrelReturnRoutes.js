const express = require('express');
const router = express.Router();
const { protect, adminOrManager } = require('../middleware/authMiddleware');
const BarrelReturn = require('../models/barrelReturnModel');
const Notification = require('../models/Notification');

// Staff: Return barrels
router.post('/return', protect, async (req, res) => {
  try {
    const { barrels, barrelIds, returnedBy, returnedAt, condition, returnReason, notes } = req.body;

    const normalizedBarrels = Array.isArray(barrels) && barrels.length
      ? barrels
      : (Array.isArray(barrelIds) ? barrelIds : [])
          .map(id => String(id || '').trim())
          .filter(Boolean)
          .map(id => ({ barrelId: id }));
    
    if (!normalizedBarrels || normalizedBarrels.length === 0) {
      return res.status(400).json({ message: 'No barrels to return' });
    }

    // Create barrel return record
    const barrelReturn = await BarrelReturn.create({
      barrels: normalizedBarrels.map(barrel => ({
        barrelId: barrel.barrelId,
        scannedAt: barrel.scannedAt ? new Date(barrel.scannedAt) : new Date(),
        scannedBy: barrel.scannedBy || (req.user?.name || req.user?.email || String(req.user?._id || 'system'))
      })),
      returnedBy: returnedBy || req.user?._id,
      returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
      condition,
      returnReason,
      notes,
      status: 'returned'
    });

    // Notify managers about returned barrels
    await notifyManagers(barrelReturn);

    res.json({
      message: 'Barrels returned successfully',
      returnId: barrelReturn._id,
      barrelCount: normalizedBarrels.length
    });
  } catch (error) {
    console.error('Error returning barrels:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Manager: Get all returned barrels
router.get('/returned', protect, adminOrManager, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const returnedBarrels = await BarrelReturn.find(query)
      .populate('returnedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BarrelReturn.countDocuments(query);

    res.json({
      returnedBarrels,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching returned barrels:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Manager: Update a return record
router.put('/returned/:id', protect, adminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { barrelIds, barrels, returnedBy, returnedAt, condition, returnReason, notes, status } = req.body || {};

    const barrelReturn = await BarrelReturn.findById(id);
    if (!barrelReturn) {
      return res.status(404).json({ message: 'Barrel return record not found' });
    }

    if (status && ['returned', 'reassigned', 'completed'].includes(status)) {
      barrelReturn.status = status;
      if (status === 'completed' && !barrelReturn.completedAt) {
        barrelReturn.completedAt = new Date();
      }
    }

    if (returnedBy) barrelReturn.returnedBy = returnedBy;
    if (returnedAt) barrelReturn.returnedAt = new Date(returnedAt);
    if (condition) barrelReturn.condition = condition;
    if (typeof returnReason === 'string') barrelReturn.returnReason = returnReason;
    if (typeof notes === 'string') barrelReturn.notes = notes;

    const normalizedBarrels = Array.isArray(barrels) && barrels.length
      ? barrels
      : (typeof barrelIds === 'string'
          ? barrelIds.split(',').map(s => s.trim()).filter(Boolean)
          : Array.isArray(barrelIds)
              ? barrelIds.map(s => String(s || '').trim()).filter(Boolean)
              : []
        ).map(barrelId => ({ barrelId }));

    if (normalizedBarrels.length) {
      barrelReturn.barrels = normalizedBarrels.map(b => ({
        barrelId: b.barrelId,
        scannedAt: b.scannedAt ? new Date(b.scannedAt) : new Date(),
        scannedBy: b.scannedBy || (req.user?.name || req.user?.email || String(req.user?._id || 'system'))
      }));
    }

    await barrelReturn.save();
    const populated = await BarrelReturn.findById(barrelReturn._id).populate('returnedBy', 'name email role');

    res.json({ message: 'Return updated successfully', returnedBarrel: populated });
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Manager: Delete a return record
router.delete('/returned/:id', protect, adminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BarrelReturn.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Barrel return record not found' });
    }
    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    console.error('Error deleting return:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Manager: Reassign returned barrels to other users
router.post('/reassign', protect, adminOrManager, async (req, res) => {
  try {
    const { returnId, reassignTo, reassignReason } = req.body;
    
    if (!returnId || !reassignTo) {
      return res.status(400).json({ message: 'Return ID and reassign to user are required' });
    }

    const barrelReturn = await BarrelReturn.findById(returnId);
    if (!barrelReturn) {
      return res.status(404).json({ message: 'Barrel return record not found' });
    }

    // Update barrel return status
    barrelReturn.status = 'reassigned';
    barrelReturn.reassignedTo = reassignTo;
    barrelReturn.reassignedAt = new Date();
    barrelReturn.reassignReason = reassignReason;
    barrelReturn.reassignedBy = req.user._id;

    await barrelReturn.save();

    // Notify the user who will receive the barrels
    await Notification.create({
      userId: reassignTo,
      title: 'Barrels Reassigned',
      message: `${barrelReturn.barrels.length} barrels have been reassigned to you`,
      link: '/staff/assigned-barrels',
      meta: {
        returnId: barrelReturn._id,
        barrelCount: barrelReturn.barrels.length
      }
    });

    res.json({
      message: 'Barrels reassigned successfully',
      reassignedCount: barrelReturn.barrels.length
    });
  } catch (error) {
    console.error('Error reassigning barrels:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Staff: Get my assigned barrels
router.get('/my-assigned', protect, async (req, res) => {
  try {
    const assignedBarrels = await BarrelReturn.find({
      reassignedTo: req.user._id,
      status: 'reassigned'
    })
    .populate('returnedBy', 'name')
    .populate('reassignedBy', 'name')
    .sort({ reassignedAt: -1 });

    res.json(assignedBarrels);
  } catch (error) {
    console.error('Error fetching assigned barrels:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Helper function to notify managers
async function notifyManagers(barrelReturn) {
  try {
    const User = require('../models/userModel');
    const managers = await User.find({ 
      role: { $in: ['manager', 'admin'] },
      status: 'active'
    }).select('_id');

    const notifications = managers.map(manager => ({
      userId: manager._id,
      title: 'Barrels Returned',
      message: `${barrelReturn.barrels.length} barrels have been returned and need reassignment`,
      link: '/manager/returned-barrels',
      meta: {
        returnId: barrelReturn._id,
        barrelCount: barrelReturn.barrels.length,
        returnedBy: barrelReturn.returnedBy
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error notifying managers:', error);
  }
}

module.exports = router;
