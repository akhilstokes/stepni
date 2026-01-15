const Barrel = require('../models/Barrel');
const QRRequest = require('../models/QRRequest');
const HangerSpace = require('../models/HangerSpace');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// 1️⃣ FIELD STAFF - Scan Barrel QR
exports.scanBarrelQR = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    // Find barrel by QR code
    const barrel = await Barrel.findOne({ qrCode })
      .populate('currentCustomer', 'name email')
      .populate('hangerSpace.addedBy', 'name');

    if (!barrel) {
      return res.status(404).json({ 
        message: 'Barrel not found',
        qrMissing: true,
        suggestion: 'Request new QR code'
      });
    }

    // Mark barrel as returned
    barrel.status = 'returned_empty';
    barrel.returnedDate = new Date();
    barrel.updatedBy = req.user.id;
    await barrel.addHistory('Scanned and marked as returned', 'returned_empty', req.user.id);

    res.json({
      message: 'Barrel scanned successfully',
      barrel: {
        barrelId: barrel.barrelId,
        qrCode: barrel.qrCode,
        status: barrel.status,
        returnedDate: barrel.returnedDate,
        customer: barrel.currentCustomer
      }
    });

  } catch (error) {
    console.error('Error scanning barrel QR:', error);
    res.status(500).json({ message: 'Error scanning barrel', error: error.message });
  }
};

// 2️⃣ FIELD STAFF - Request New QR
exports.requestNewQR = async (req, res) => {
  try {
    const { numberOfBarrels, reason, notes, priority } = req.body;

    if (!numberOfBarrels || numberOfBarrels < 1) {
      return res.status(400).json({ message: 'Number of barrels must be at least 1' });
    }

    const qrRequest = new QRRequest({
      numberOfBarrels,
      requestedBy: req.user.id,
      reason: reason || 'qr_missing',
      notes,
      priority: priority || 'medium',
      status: 'pending'
    });

    await qrRequest.save();

    const populatedRequest = await QRRequest.findById(qrRequest._id)
      .populate('requestedBy', 'name email phone');

    res.status(201).json({
      message: 'QR request submitted successfully',
      request: populatedRequest
    });

  } catch (error) {
    console.error('Error creating QR request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
};

// 3️⃣ ADMIN - Get Pending QR Requests
exports.getPendingQRRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const requests = await QRRequest.find({ status })
      .populate('requestedBy', 'name email phone role')
      .populate('approvedBy', 'name email')
      .sort({ priority: -1, requestedDate: -1 });

    res.json({
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Error fetching QR requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// 3️⃣ ADMIN - Approve and Generate QR Codes
exports.approveAndGenerateQR = async (req, res) => {
  try {
    const { requestId } = req.params;

    const qrRequest = await QRRequest.findById(requestId);
    
    if (!qrRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (qrRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Approve request
    await qrRequest.approve(req.user.id);

    // Generate QR codes for each barrel
    const generatedQRs = [];

    for (let i = 0; i < qrRequest.numberOfBarrels; i++) {
      // Generate unique barrel ID and QR code
      const barrelId = `BRL-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
      const qrCodeData = `HFP-BARREL-${barrelId}`;

      // Generate QR code image as data URL
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create new barrel record
      const barrel = new Barrel({
        barrelId,
        qrCode: qrCodeData,
        qrCodeUrl,
        status: 'qr_generated',
        qrRequest: {
          requestedBy: qrRequest.requestedBy,
          requestedDate: qrRequest.requestedDate,
          status: 'approved',
          approvedBy: req.user.id,
          approvedDate: new Date()
        },
        createdBy: req.user.id
      });

      await barrel.save();
      await barrel.addHistory('QR code generated', 'qr_generated', req.user.id, `Request: ${qrRequest.requestNumber}`);

      // Add to request
      await qrRequest.addGeneratedQR(barrelId, qrCodeData, qrCodeUrl);

      generatedQRs.push({
        barrelId,
        qrCode: qrCodeData,
        qrCodeUrl
      });
    }

    const updatedRequest = await QRRequest.findById(requestId)
      .populate('requestedBy', 'name email phone')
      .populate('approvedBy', 'name email');

    res.json({
      message: `Generated ${generatedQRs.length} QR codes successfully`,
      request: updatedRequest,
      qrCodes: generatedQRs
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({ message: 'Error generating QR codes', error: error.message });
  }
};

// 3️⃣ ADMIN - Reject QR Request
exports.rejectQRRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const qrRequest = await QRRequest.findById(requestId);
    
    if (!qrRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await qrRequest.reject(req.user.id, reason);

    const updatedRequest = await QRRequest.findById(requestId)
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      message: 'Request rejected',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
};

// 4️⃣ FIELD STAFF - Get My QR Requests
exports.getMyQRRequests = async (req, res) => {
  try {
    const requests = await QRRequest.find({ requestedBy: req.user.id })
      .populate('approvedBy', 'name email')
      .sort({ requestedDate: -1 });

    res.json({
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// 4️⃣ FIELD STAFF - Confirm QR Attachment
exports.confirmQRAttachment = async (req, res) => {
  try {
    const { qrCode, requestId } = req.body;

    if (!qrCode || !requestId) {
      return res.status(400).json({ message: 'QR code and request ID are required' });
    }

    // Find barrel and update status
    const barrel = await Barrel.findOne({ qrCode });
    
    if (!barrel) {
      return res.status(404).json({ message: 'Barrel not found' });
    }

    barrel.status = 'returned_empty';
    barrel.updatedBy = req.user.id;
    await barrel.addHistory('QR code attached to barrel', 'returned_empty', req.user.id);

    // Update QR request
    const qrRequest = await QRRequest.findById(requestId);
    if (qrRequest) {
      await qrRequest.markQRAttached(qrCode, req.user.id);
    }

    res.json({
      message: 'QR attachment confirmed',
      barrel: {
        barrelId: barrel.barrelId,
        qrCode: barrel.qrCode,
        status: barrel.status
      }
    });

  } catch (error) {
    console.error('Error confirming QR attachment:', error);
    res.status(500).json({ message: 'Error confirming attachment', error: error.message });
  }
};

// 5️⃣ FIELD STAFF - Add Barrel to Hanger Space
exports.addBarrelToHanger = async (req, res) => {
  try {
    const { barrelId, hangerSpaceId, slotNumber } = req.body;

    if (!barrelId || !hangerSpaceId || !slotNumber) {
      return res.status(400).json({ 
        message: 'Barrel ID, hanger space ID, and slot number are required' 
      });
    }

    // Find barrel
    const barrel = await Barrel.findOne({ barrelId });
    
    if (!barrel) {
      return res.status(404).json({ message: 'Barrel not found' });
    }

    if (barrel.status !== 'returned_empty') {
      return res.status(400).json({ 
        message: 'Barrel must be in returned_empty status to add to hanger' 
      });
    }

    // Find hanger space
    const hangerSpace = await HangerSpace.findById(hangerSpaceId);
    
    if (!hangerSpace) {
      return res.status(404).json({ message: 'Hanger space not found' });
    }

    // Add barrel to hanger space
    await hangerSpace.addBarrel(slotNumber, barrel._id, req.user.id);

    // Update barrel
    await barrel.addToHanger(hangerSpace.location, slotNumber, req.user.id);

    // TODO: Send notification to Admin and Manager

    res.json({
      message: 'Barrel added to hanger space successfully',
      barrel: {
        barrelId: barrel.barrelId,
        status: barrel.status,
        hangerSpace: barrel.hangerSpace
      },
      hangerSpace: {
        location: hangerSpace.location,
        availableSlots: hangerSpace.availableSlots,
        occupiedSlots: hangerSpace.occupiedSlots
      }
    });

  } catch (error) {
    console.error('Error adding barrel to hanger:', error);
    res.status(500).json({ message: 'Error adding barrel to hanger', error: error.message });
  }
};

// 5️⃣ Get Hanger Spaces
exports.getHangerSpaces = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const hangerSpaces = await HangerSpace.find({ isActive })
      .populate('slots.barrel', 'barrelId qrCode status')
      .populate('slots.addedBy', 'name')
      .sort({ location: 1 });

    // Get total capacity
    const totalCapacity = await HangerSpace.getTotalAvailableCapacity();

    res.json({
      count: hangerSpaces.length,
      hangerSpaces,
      totalCapacity
    });

  } catch (error) {
    console.error('Error fetching hanger spaces:', error);
    res.status(500).json({ message: 'Error fetching hanger spaces', error: error.message });
  }
};

// 6️⃣ ADMIN - Assign Barrel to Customer
exports.assignBarrelToCustomer = async (req, res) => {
  try {
    const { barrelId, customerId } = req.body;

    if (!barrelId || !customerId) {
      return res.status(400).json({ message: 'Barrel ID and customer ID are required' });
    }

    const barrel = await Barrel.findOne({ barrelId });
    
    if (!barrel) {
      return res.status(404).json({ message: 'Barrel not found' });
    }

    if (barrel.status !== 'in_hanger_space') {
      return res.status(400).json({ 
        message: 'Barrel must be in hanger space to assign to customer' 
      });
    }

    // Remove from hanger space
    if (barrel.hangerSpace && barrel.hangerSpace.location) {
      const hangerSpace = await HangerSpace.findOne({ 
        location: barrel.hangerSpace.location 
      });
      
      if (hangerSpace) {
        await hangerSpace.removeBarrel(barrel.hangerSpace.slot, req.user.id);
      }
    }

    // Assign to customer
    await barrel.assignToCustomer(customerId, req.user.id);

    res.json({
      message: 'Barrel assigned to customer successfully',
      barrel: {
        barrelId: barrel.barrelId,
        status: barrel.status,
        customer: barrel.currentCustomer,
        assignedDate: barrel.assignedDate
      }
    });

  } catch (error) {
    console.error('Error assigning barrel to customer:', error);
    res.status(500).json({ message: 'Error assigning barrel', error: error.message });
  }
};

// Get Barrel Details
exports.getBarrelDetails = async (req, res) => {
  try {
    const { barrelId } = req.params;

    const barrel = await Barrel.findOne({ barrelId })
      .populate('currentCustomer', 'name email phone')
      .populate('hangerSpace.addedBy', 'name email')
      .populate('qrRequest.requestedBy', 'name email')
      .populate('qrRequest.approvedBy', 'name email')
      .populate('history.performedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!barrel) {
      return res.status(404).json({ message: 'Barrel not found' });
    }

    res.json(barrel);

  } catch (error) {
    console.error('Error fetching barrel details:', error);
    res.status(500).json({ message: 'Error fetching barrel', error: error.message });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Barrel.countDocuments({ status: 'in_hanger_space' }),
      Barrel.countDocuments({ status: 'assigned_to_customer' }),
      Barrel.countDocuments({ status: 'returned_empty' }),
      QRRequest.countDocuments({ status: 'pending' }),
      HangerSpace.getTotalAvailableCapacity()
    ]);

    res.json({
      inHangerSpace: stats[0],
      assignedToCustomers: stats[1],
      returnedEmpty: stats[2],
      pendingQRRequests: stats[3],
      hangerCapacity: stats[4]
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
