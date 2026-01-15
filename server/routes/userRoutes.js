const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');

// This single line imports all necessary functions from the controller at once
const { 
    listUsers,
    listFarmers,
    submitBillRequest, 
    getUserProfile, 
    updateUserProfile,
    getMySubmissions 
} = require('../controllers/userController');

// Public/protected users listing used by staff dispatch selections
router.get('/', protect, listUsers);
// Farmers list for field collection forms
router.get('/farmers', protect, listFarmers);

// Get all staff members (for manager schedule page)
router.get('/all-staff', protect, async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['field_staff', 'delivery_staff', 'lab_staff', 'staff', 'accountant'] }
    }).select('name email phoneNumber role').sort({ name: 1 });

    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch staff' 
    });
  }
});

// Define the routes for the user
router.post('/submit-bill', protect, submitBillRequest);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/my-submissions', protect, getMySubmissions);

module.exports = router;