const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const BarrelRequest = require('../models/barrelRequestModel');
const SellRequest = require('../models/sellRequestModel');
const User = require('../models/userModel');
const Barrel = require('../models/barrelModel');

// Helper function to generate unique IDs with year-based sequential format
const generateBarrelId = async () => {
  const year = new Date().getFullYear();
  
  // Find the highest barrel number from existing barrels for current year
  const latestBarrel = await Barrel.findOne({
    barrelId: new RegExp(`^BRL-${year}-`)
  }).sort({ barrelId: -1 });
  
  let nextNumber = 1;
  if (latestBarrel) {
    const match = latestBarrel.barrelId.match(/^BRL-\d{4}-(\d{3})$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `BRL-${year}-${nextNumber.toString().padStart(3, '0')}`;
};

// BARREL REGISTRATION ROUTES
// Register new barrels (Admin only)
router.post('/admin/register-barrels', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { barrelType, capacity, material, color, quantity, location, notes } = req.body;
    
    // Generate and save barrel records to database
    const barrels = [];
    for (let i = 0; i < parseInt(quantity); i++) {
      const barrelId = await generateBarrelId();
      
      const barrel = new Barrel({
        barrelId,
        type: barrelType,
        capacity,
        material,
        color,
        location,
        notes,
        status: 'available',
        registeredBy: req.user.name || 'Admin',
        registeredById: req.user._id,
        registeredDate: new Date()
      });
      
      await barrel.save();
      
      // Format for frontend
      barrels.push({
        id: barrel.barrelId,
        type: barrel.type,
        capacity: barrel.capacity,
        material: barrel.material,
        color: barrel.color,
        location: barrel.location,
        notes: barrel.notes,
        status: barrel.status,
        registeredDate: barrel.registeredDate,
        registeredBy: barrel.registeredBy
      });
    }

    res.json({ 
      success: true, 
      message: `Successfully registered ${quantity} barrel(s) by ${req.user.name}`,
      barrels,
      registeredBy: req.user.name,
      registrationDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registering barrels:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get registered barrels (Admin only)
router.get('/admin/registered-barrels', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { availableOnly } = req.query;

    // Build query filter
    const filter = {};
    if (availableOnly === 'true') {
      filter.status = 'available';
    }

    // Fetch barrels from database with optional filter
    const barrels = await Barrel.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ registeredDate: -1 });
    
    // Format for frontend
    const formattedBarrels = barrels.map(barrel => ({
      id: barrel.barrelId,
      barrelId: barrel.barrelId,
      type: barrel.type,
      capacity: barrel.capacity,
      material: barrel.material,
      color: barrel.color,
      location: barrel.location,
      notes: barrel.notes,
      status: barrel.status,
      registeredDate: barrel.registeredDate,
      registeredBy: barrel.registeredBy,
      assignedTo: barrel.assignedTo ? {
        id: barrel.assignedTo._id,
        name: barrel.assignedTo.name,
        email: barrel.assignedTo.email
      } : null,
      assignedDate: barrel.assignedDate,
      isAvailable: barrel.status === 'available'
    }));

    // Count by status
    const statusCounts = {
      available: formattedBarrels.filter(b => b.status === 'available').length,
      inUse: formattedBarrels.filter(b => b.status === 'in-use').length,
      maintenance: formattedBarrels.filter(b => b.status === 'maintenance').length,
      assigned: formattedBarrels.filter(b => b.status === 'assigned').length
    };

    res.json({ 
      barrels: formattedBarrels,
      total: formattedBarrels.length,
      statusCounts
    });
  } catch (error) {
    console.error('Error fetching barrels:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADMIN ROUTES
// Get all barrel requests for admin approval
router.get('/admin/barrel-requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await BarrelRequest.find()
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve barrel request
router.put('/admin/barrel-requests/:id/approve', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const request = await BarrelRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'approved';
    request.adminNotes = req.body.adminNotes || 'Approved by admin';
    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// USER ROUTES
// Create barrel request
router.post('/user/barrel-requests', protect, async (req, res) => {
  try {
    const { quantity, notes } = req.body;

    const request = new BarrelRequest({
      user: req.user._id,
      quantity: quantity || 1,
      notes: notes || ''
    });

    await request.save();
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's barrel requests
router.get('/user/barrel-requests', protect, async (req, res) => {
  try {
    const requests = await BarrelRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user stock (simplified)
router.get('/user/stock', protect, async (req, res) => {
  try {
    const approvedRequests = await BarrelRequest.find({ 
      user: req.user._id, 
      status: 'approved' 
    });
    
    const totalReceived = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
    
    res.json({
      currentStock: totalReceived,
      totalReceived,
      totalSold: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MANAGER ROUTES
// Get sell requests for approval
router.get('/manager/sell-requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await SellRequest.find()
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DASHBOARD STATS
router.get('/stats/:role', protect, async (req, res) => {
  try {
    const { role } = req.params;
    let stats = {};

    switch (role) {
      case 'admin':
        stats = {
          totalBarrels: 100, // Mock data
          availableBarrels: 75,
          pendingRequests: await BarrelRequest.countDocuments({ status: 'pending' }),
          activeUsers: await User.countDocuments({ status: 'active' })
        };
        break;
      
      case 'manager':
        stats = {
          pendingSellRequests: await SellRequest.countDocuments({ status: 'pending' }),
          pendingBillApprovals: 0,
          approvedToday: 0
        };
        break;
      
      case 'accountant':
        stats = {
          pendingDrc: 0,
          pendingPayments: 0,
          completedToday: 0
        };
        break;
      
      case 'lab_staff':
        stats = {
          pendingTests: 0,
          completedToday: 0
        };
        break;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get users by role (for dropdowns)
router.get('/users', protect, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter)
      .select('name email phoneNumber role')
      .sort({ name: 1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;