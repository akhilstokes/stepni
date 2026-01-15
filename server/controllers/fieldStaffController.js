const User = require('../models/userModel');
const Barrel = require('../models/barrelModel');
const SellRequest = require('../models/sellRequestModel');
const ReturnBarrelRequest = require('../models/returnBarrelRequestModel');

// Get field staff dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's barrel activities
    const barrelsScanned = await Barrel.countDocuments({
      lastScannedBy: userId,
      lastScannedAt: { $gte: today, $lt: tomorrow }
    });

    const barrelsPickedUp = await Barrel.countDocuments({
      status: 'picked_up',
      lastScannedBy: userId,
      lastScannedAt: { $gte: today, $lt: tomorrow }
    });

    const barrelsDelivered = await Barrel.countDocuments({
      status: 'delivered',
      lastScannedBy: userId,
      lastScannedAt: { $gte: today, $lt: tomorrow }
    });

    const barrelsDamaged = await Barrel.countDocuments({
      status: 'damaged',
      lastScannedBy: userId,
      lastScannedAt: { $gte: today, $lt: tomorrow }
    });

    res.json({
      barrelsScanned,
      barrelsPickedUp,
      barrelsDelivered,
      barrelsDamaged
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Get recent activity for field staff
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent barrel scans
    const recentBarrels = await Barrel.find({
      lastScannedBy: userId
    })
    .sort({ lastScannedAt: -1 })
    .limit(limit)
    .populate('farmerId', 'name')
    .select('barrelId status lastScannedAt location');

    const activities = recentBarrels.map(barrel => ({
      id: barrel._id,
      type: 'scan',
      title: `Barrel ${barrel.barrelId} scanned`,
      description: `Status updated to ${barrel.status}`,
      status: 'completed',
      timestamp: barrel.lastScannedAt,
      location: barrel.location
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
};

// Update barrel status via QR scan
exports.updateBarrelStatus = async (req, res) => {
  try {
    const { id: barrelId, status, location } = req.body;
    const userId = req.user.id;

    if (!barrelId || !status) {
      return res.status(400).json({ message: 'Barrel ID and status are required' });
    }

    // Find barrel by ID or barrelId field
    let barrel = await Barrel.findOne({
      $or: [
        { _id: barrelId },
        { barrelId: barrelId }
      ]
    });

    if (!barrel) {
      return res.status(404).json({ message: 'Barrel not found' });
    }

    // Update barrel status and tracking info
    barrel.status = status;
    barrel.lastScannedBy = userId;
    barrel.lastScannedAt = new Date();
    
    if (location) {
      barrel.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      };
    }

    await barrel.save();

    res.json({
      success: true,
      message: 'Barrel status updated successfully',
      barrel: {
        id: barrel._id,
        barrelId: barrel.barrelId,
        status: barrel.status,
        lastScannedAt: barrel.lastScannedAt
      }
    });
  } catch (error) {
    console.error('Error updating barrel status:', error);
    res.status(500).json({ message: 'Failed to update barrel status' });
  }
};

// Get assigned routes for field staff
exports.getRoutes = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Get sell requests assigned to this field staff
    const assignedRequests = await SellRequest.find({
      assignedFieldStaffId: userId,
      status: { $in: ['FIELD_ASSIGNED', 'IN_PROGRESS'] }
    })
    .populate('farmerId', 'name address phoneNumber')
    .populate('barrelIds', 'barrelId status')
    .sort({ createdAt: -1 });

    // Group requests into routes
    const routes = assignedRequests.map((request, index) => ({
      id: request._id,
      name: `Route ${String.fromCharCode(65 + index)} - ${request.farmerId?.name || 'Unknown'}`,
      locations: [request.farmerId?.address || 'Unknown Location'],
      status: request.status === 'FIELD_ASSIGNED' ? 'pending' : 'active',
      estimatedTime: '2-3 hours',
      distance: '15-20 km',
      barrels: request.barrelIds?.length || 0,
      farmer: request.farmerId
    }));

    res.json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Failed to fetch routes' });
  }
};

// Get field staff reports
exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get barrel activities for the date
    const barrels = await Barrel.find({
      lastScannedBy: userId,
      lastScannedAt: { $gte: startDate, $lte: endDate }
    });

    const barrelsCollected = barrels.filter(b => b.status === 'picked_up').length;
    const barrelsDelivered = barrels.filter(b => b.status === 'delivered').length;

    // Mock report data - in real implementation, this would come from a reports collection
    const reports = [{
      id: 1,
      date: date,
      type: 'daily',
      barrelsCollected,
      barrelsDelivered,
      status: barrelsCollected > 0 ? 'completed' : 'pending',
      issues: 'None',
      notes: `Processed ${barrelsCollected} barrels, delivered ${barrelsDelivered}`,
      createdAt: new Date().toISOString()
    }];

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, date, barrelsCollected, barrelsDelivered, issues, notes } = req.body;

    // In a real implementation, you would save this to a Reports collection
    // For now, we'll just return success
    const report = {
      id: Date.now(),
      userId,
      type,
      date,
      barrelsCollected: parseInt(barrelsCollected) || 0,
      barrelsDelivered: parseInt(barrelsDelivered) || 0,
      issues: issues || '',
      notes: notes || '',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Failed to create report' });
  }
};

// Update field staff profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneNumber, address, emergencyContact, vehicleInfo } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phoneNumber,
        address,
        emergencyContact,
        vehicleInfo
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Submit return barrels request
exports.submitReturnBarrels = async (req, res) => {
  try {
    const { barrelIds, reason, notes, returnedBy, returnedByName } = req.body;

    if (!barrelIds || barrelIds.length === 0) {
      return res.status(400).json({ message: 'At least one barrel ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason for return is required' });
    }

    // Validate that all barrels exist
    const existingBarrels = await Barrel.find({ barrelId: { $in: barrelIds } });
    if (existingBarrels.length !== barrelIds.length) {
      return res.status(400).json({ 
        message: 'Some barrel IDs are invalid',
        validBarrels: existingBarrels.map(b => b.barrelId),
        invalidBarrels: barrelIds.filter(id => !existingBarrels.find(b => b.barrelId === id))
      });
    }

    // Create return request in database
    const returnRequest = new ReturnBarrelRequest({
      requestType: 'return',
      requestedBy: returnedBy,
      requestedByName: returnedByName,
      barrelIds,
      numberOfBarrels: barrelIds.length,
      reason,
      notes: notes || '',
      status: 'pending'
    });

    await returnRequest.save();

    // Update barrel statuses to 'in-storage' and clear assignment
    await Barrel.updateMany(
      { barrelId: { $in: barrelIds } },
      {
        $set: {
          status: 'in-storage',
          assignedTo: null,
          lastUpdatedBy: returnedBy,
          currentLocation: 'factory',
          notes: `Returned by ${returnedByName} - Reason: ${reason.replace(/_/g, ' ')}`
        },
        $push: {
          trackingHistory: {
            scannedBy: returnedBy,
            status: 'returned',
            timestamp: new Date()
          }
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully. Admin will be notified.',
      returnRequest: {
        id: returnRequest._id,
        barrelIds: returnRequest.barrelIds,
        numberOfBarrels: returnRequest.numberOfBarrels,
        reason: returnRequest.reason,
        status: returnRequest.status,
        submittedAt: returnRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting return barrels:', error);
    res.status(500).json({ message: 'Failed to submit return request' });
  }
};

// Request barrel IDs from admin (when no scanner available)
exports.requestBarrelIds = async (req, res) => {
  try {
    const { numberOfBarrels, reason, notes, requestedBy, requestedByName } = req.body;

    if (!numberOfBarrels || numberOfBarrels < 1) {
      return res.status(400).json({ message: 'Valid number of barrels is required' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason for return is required' });
    }

    // Create barrel ID request in database
    const barrelIdRequest = new ReturnBarrelRequest({
      requestType: 'barrel_id_request',
      requestedBy,
      requestedByName,
      numberOfBarrels,
      reason,
      notes: notes || '',
      status: 'pending',
      barrelIds: [],
      assignedBarrelIds: []
    });

    await barrelIdRequest.save();

    res.status(201).json({
      success: true,
      message: 'Barrel ID request sent to admin successfully. You will be notified once barrel IDs are assigned.',
      request: {
        id: barrelIdRequest._id,
        numberOfBarrels: barrelIdRequest.numberOfBarrels,
        reason: barrelIdRequest.reason,
        status: barrelIdRequest.status,
        requestedAt: barrelIdRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error requesting barrel IDs:', error);
    res.status(500).json({ message: 'Failed to send barrel ID request' });
  }
};

// Get return barrel requests for field staff
exports.getReturnBarrelRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status; // optional filter

    const query = { requestedBy: userId };
    if (status) {
      query.status = status;
    }

    const requests = await ReturnBarrelRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching return barrel requests:', error);
    res.status(500).json({ message: 'Failed to fetch return barrel requests' });
  }
};
