const ReturnBarrelRequest = require('../models/returnBarrelRequestModel');
const Barrel = require('../models/barrelModel');
const User = require('../models/userModel');

// Get all return barrel requests (admin view)
exports.getAllReturnBarrelRequests = async (req, res) => {
  try {
    const { status, requestType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;

    const requests = await ReturnBarrelRequest.find(query)
      .populate('requestedBy', 'name email phoneNumber')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error fetching return barrel requests:', error);
    res.status(500).json({ message: 'Failed to fetch return barrel requests' });
  }
};

// Approve barrel ID request and assign barrel IDs
exports.approveBarrelIdRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { assignedBarrelIds } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name;

    if (!assignedBarrelIds || assignedBarrelIds.length === 0) {
      return res.status(400).json({ message: 'Assigned barrel IDs are required' });
    }

    const request = await ReturnBarrelRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestType !== 'barrel_id_request') {
      return res.status(400).json({ message: 'This is not a barrel ID request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    if (assignedBarrelIds.length !== request.numberOfBarrels) {
      return res.status(400).json({ 
        message: `Number of assigned barrel IDs (${assignedBarrelIds.length}) does not match requested number (${request.numberOfBarrels})` 
      });
    }

    // Validate all barrel IDs exist
    const barrels = await Barrel.find({ barrelId: { $in: assignedBarrelIds } });
    if (barrels.length !== assignedBarrelIds.length) {
      return res.status(400).json({ 
        message: 'Some barrel IDs are invalid',
        validBarrels: barrels.map(b => b.barrelId),
        invalidBarrels: assignedBarrelIds.filter(id => !barrels.find(b => b.barrelId === id))
      });
    }

    // Update request
    request.status = 'approved';
    request.assignedBarrelIds = assignedBarrelIds;
    request.processedBy = adminId;
    request.processedByName = adminName;
    request.processedAt = new Date();
    await request.save();

    // Assign barrels to field staff
    await Barrel.updateMany(
      { barrelId: { $in: assignedBarrelIds } },
      {
        $set: {
          assignedTo: request.requestedBy,
          status: 'in-use',
          lastUpdatedBy: adminId,
          notes: `Assigned to ${request.requestedByName} for ${request.reason.replace(/_/g, ' ')}`
        }
      }
    );

    res.json({
      success: true,
      message: 'Barrel ID request approved and barrels assigned',
      request
    });
  } catch (error) {
    console.error('Error approving barrel ID request:', error);
    res.status(500).json({ message: 'Failed to approve barrel ID request' });
  }
};

// Reject barrel ID request
exports.rejectBarrelIdRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const request = await ReturnBarrelRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    request.processedBy = adminId;
    request.processedByName = adminName;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Barrel ID request rejected',
      request
    });
  } catch (error) {
    console.error('Error rejecting barrel ID request:', error);
    res.status(500).json({ message: 'Failed to reject barrel ID request' });
  }
};

// Mark return barrel request as completed
exports.completeReturnBarrelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;
    const adminName = req.user.name;

    const request = await ReturnBarrelRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestType !== 'return') {
      return res.status(400).json({ message: 'This is not a return barrel request' });
    }

    request.status = 'completed';
    request.processedBy = adminId;
    request.processedByName = adminName;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Return barrel request marked as completed',
      request
    });
  } catch (error) {
    console.error('Error completing return barrel request:', error);
    res.status(500).json({ message: 'Failed to complete return barrel request' });
  }
};

// Functions are already exported using exports.functionName above
// No need for module.exports here
