const Bill = require('../models/billModel');
const User = require('../models/userModel');

// Create a new bill (Accountant)
exports.createBill = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      sampleId,
      labStaff,
      drcPercent,
      barrelCount,
      latexVolume,
      marketRate,
      accountantNotes,
      userId
    } = req.body;

    // Validate required fields
    if (!customerName || !drcPercent || !barrelCount || !latexVolume || !marketRate) {
      return res.status(400).json({ 
        message: 'Missing required fields: customerName, drcPercent, barrelCount, latexVolume, marketRate' 
      });
    }

    // Calculate billing amounts
    const latexWeight = parseFloat(latexVolume); // 1 liter = 1 kg for latex
    const dryRubber = latexWeight * (parseFloat(drcPercent) / 100);
    const perKgRate = parseFloat(marketRate) / 100;
    const totalAmount = dryRubber * perKgRate;
    const perBarrelAmount = totalAmount / parseInt(barrelCount);

    // Generate bill number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last bill number for this month
    const lastBill = await Bill.findOne({
      billNumber: new RegExp(`^BILL-${year}${month}-`)
    }).sort({ billNumber: -1 });
    
    let sequence = 1;
    if (lastBill) {
      const lastSequence = parseInt(lastBill.billNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const billNumber = `BILL-${year}${month}-${String(sequence).padStart(4, '0')}`;

    // Create bill
    const bill = await Bill.create({
      billNumber,
      customerName,
      customerPhone,
      sampleId,
      labStaff,
      drcPercent: parseFloat(drcPercent),
      barrelCount: parseInt(barrelCount),
      latexVolume: parseFloat(latexVolume),
      latexWeight,
      dryRubber,
      marketRate: parseFloat(marketRate),
      perKgRate,
      totalAmount,
      perBarrelAmount,
      createdBy: req.user._id,
      accountantNotes,
      userId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ 
      message: 'Failed to create bill', 
      error: error.message 
    });
  }
};

// Get bills for accountant
exports.getAccountantBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { createdBy: req.user._id };
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get accountant bills error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bills', 
      error: error.message 
    });
  }
};

// Get pending bills for manager verification
exports.getManagerPendingBills = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bills = await Bill.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get manager pending bills error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch pending bills', 
      error: error.message 
    });
  }
};

// Get all bills for manager (history)
exports.getManagerAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get manager all bills error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bills', 
      error: error.message 
    });
  }
};

// Verify bill (Manager)
exports.verifyBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerNotes } = req.body;

    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Bill is not in pending status' 
      });
    }

    bill.status = 'manager_verified';
    bill.verifiedBy = req.user._id;
    bill.verifiedAt = new Date();
    if (managerNotes) bill.managerNotes = managerNotes;

    await bill.save();

    // Populate for response
    await bill.populate('createdBy', 'name email');
    await bill.populate('verifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Bill verified successfully',
      bill
    });
  } catch (error) {
    console.error('Verify bill error:', error);
    res.status(500).json({ 
      message: 'Failed to verify bill', 
      error: error.message 
    });
  }
};

// Reject bill (Manager)
exports.rejectBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ 
        message: 'Rejection reason is required' 
      });
    }

    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Bill is not in pending status' 
      });
    }

    bill.status = 'rejected';
    bill.verifiedBy = req.user._id;
    bill.verifiedAt = new Date();
    bill.rejectionReason = rejectionReason;

    await bill.save();

    // Populate for response
    await bill.populate('createdBy', 'name email');
    await bill.populate('verifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Bill rejected',
      bill
    });
  } catch (error) {
    console.error('Reject bill error:', error);
    res.status(500).json({ 
      message: 'Failed to reject bill', 
      error: error.message 
    });
  }
};

// Get user bills
exports.getUserBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { 
      userId: req.user._id,
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    };
    
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get user bills error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bills', 
      error: error.message 
    });
  }
};

// Get bill by ID
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('userId', 'name email phone');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill by ID error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bill', 
      error: error.message 
    });
  }
};

// Get all bills (Admin)
exports.getAllBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get all bills error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bills', 
      error: error.message 
    });
  }
};
