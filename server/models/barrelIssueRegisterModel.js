const mongoose = require('mongoose');

/**
 * Barrel Issue Register Model
 * 
 * Purpose: Transaction ledger for barrel assignments
 * Granularity: ONE entry per barrel per issue cycle
 * 
 * Key Principles:
 * - Immutable after creation (append-only ledger)
 * - Captures user snapshot at time of issue
 * - Enables audit trail and responsibility tracking
 * - Supports overdue detection
 */

const barrelIssueRegisterSchema = new mongoose.Schema({
  // Unique register entry identifier
  registerId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    // Format: REG-YYYY-XXXXXX (e.g., REG-2026-000001)
  },

  // Link to original barrel request
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BarrelRequest',
    required: true,
    index: true,
  },

  // User who received the barrel
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Snapshot of user name at time of issue (for audit trail)
  // Important: Captures name even if user is later deleted/renamed
  userNameSnapshot: {
    type: String,
    required: true,
  },

  // User email snapshot (additional audit data)
  userEmailSnapshot: {
    type: String,
    required: true,
  },

  // Barrel that was issued
  barrelId: {
    type: String,
    required: true,
    index: true,
    // References Barrel.barrelId (e.g., BRL-2026-001)
  },

  // Barrel details snapshot (for historical reference)
  barrelSnapshot: {
    type: {
      type: String,
    },
    capacity: String,
    material: String,
  },

  // When barrel was issued to user
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },

  // Expected return date (for overdue calculation)
  expectedReturnDate: {
    type: Date,
    required: true,
    index: true,
  },

  // Actual return date (null until returned)
  actualReturnDate: {
    type: Date,
    default: null,
    index: true,
  },

  // Admin who issued the barrel
  issuedByAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Admin name snapshot
  issuedByAdminName: {
    type: String,
    required: true,
  },

  // Admin who processed the return (if returned)
  returnedByAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Return admin name snapshot
  returnedByAdminName: {
    type: String,
  },

  // Current status of this issue transaction
  status: {
    type: String,
    enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'],
    default: 'ISSUED',
    required: true,
    index: true,
  },

  // Delivery information (if applicable)
  deliveryStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  deliveryDate: {
    type: Date,
  },

  deliveryLocation: {
    type: String,
  },

  // Return condition assessment
  returnCondition: {
    type: String,
    enum: ['GOOD', 'FAIR', 'DAMAGED', 'LOST'],
  },

  // Notes from admin during issue
  issueNotes: {
    type: String,
    default: '',
  },

  // Notes from admin during return
  returnNotes: {
    type: String,
    default: '',
  },

  // Days overdue (calculated field, updated by cron job)
  daysOverdue: {
    type: Number,
    default: 0,
  },

  // Penalty/fine amount (if applicable)
  penaltyAmount: {
    type: Number,
    default: 0,
  },

}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for efficient queries
barrelIssueRegisterSchema.index({ status: 1, expectedReturnDate: 1 }); // Overdue detection
barrelIssueRegisterSchema.index({ userId: 1, status: 1 }); // User's active issues
barrelIssueRegisterSchema.index({ barrelId: 1, issueDate: -1 }); // Barrel history
barrelIssueRegisterSchema.index({ issueDate: -1 }); // Recent issues

// Virtual field: Is this issue overdue?
barrelIssueRegisterSchema.virtual('isOverdue').get(function() {
  if (this.status === 'RETURNED') return false;
  return new Date() > this.expectedReturnDate;
});

// Method: Calculate days overdue
barrelIssueRegisterSchema.methods.calculateDaysOverdue = function() {
  if (this.status === 'RETURNED') return 0;
  const now = new Date();
  const expected = new Date(this.expectedReturnDate);
  if (now <= expected) return 0;
  
  const diffTime = Math.abs(now - expected);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static method: Generate next register ID
barrelIssueRegisterSchema.statics.generateRegisterId = async function() {
  const year = new Date().getFullYear();
  const prefix = `REG-${year}-`;
  
  // Find the highest register number for current year
  const lastRegister = await this.findOne({
    registerId: new RegExp(`^${prefix}`)
  }).sort({ registerId: -1 });
  
  let nextNumber = 1;
  if (lastRegister) {
    const match = lastRegister.registerId.match(/REG-\d{4}-(\d{6})$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
};

// Static method: Find overdue issues
barrelIssueRegisterSchema.statics.findOverdueIssues = function() {
  return this.find({
    status: 'ISSUED',
    expectedReturnDate: { $lt: new Date() }
  }).populate('userId', 'name email phoneNumber')
    .populate('issuedByAdminId', 'name');
};

// Static method: Get user's active issues
barrelIssueRegisterSchema.statics.getUserActiveIssues = function(userId) {
  return this.find({
    userId: userId,
    status: { $in: ['ISSUED', 'OVERDUE'] }
  }).sort({ issueDate: -1 });
};

// Static method: Get barrel history
barrelIssueRegisterSchema.statics.getBarrelHistory = function(barrelId) {
  return this.find({ barrelId: barrelId })
    .populate('userId', 'name email')
    .populate('issuedByAdminId', 'name')
    .sort({ issueDate: -1 });
};

// Pre-save hook: Auto-update overdue status
barrelIssueRegisterSchema.pre('save', function(next) {
  if (this.status === 'ISSUED' && new Date() > this.expectedReturnDate) {
    this.status = 'OVERDUE';
    this.daysOverdue = this.calculateDaysOverdue();
  }
  next();
});

module.exports = mongoose.model('BarrelIssueRegister', barrelIssueRegisterSchema);
