const mongoose = require('mongoose');

const barrelSchema = new mongoose.Schema({
  // Barrel identification
  barrelId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
    trim: true
  },
  qrCodeUrl: {
    type: String, // URL to QR code image
    trim: true
  },
  
  // Barrel status
  status: {
    type: String,
    enum: [
      'new',                    // Brand new barrel
      'assigned_to_customer',   // Given to customer
      'in_use',                 // Customer is using it
      'returned_empty',         // Returned but not in hanger yet
      'in_hanger_space',        // Stored in hanger space
      'qr_missing',             // QR code damaged/missing
      'pending_qr_approval',    // Waiting for admin to generate new QR
      'qr_generated',           // New QR generated, waiting for attachment
      'retired'                 // Barrel no longer in use
    ],
    default: 'new',
    required: true
  },
  
  // Customer assignment
  currentCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  assignedDate: Date,
  returnedDate: Date,
  
  // Hanger space information
  hangerSpace: {
    location: String,
    slot: String,
    addedDate: Date,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // QR request tracking
  qrRequest: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedDate: Date,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: Date,
    rejectionReason: String
  },
  
  // Physical condition
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  capacity: {
    type: Number, // in liters
    default: 200
  },
  
  // History tracking
  history: [{
    action: String,
    status: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    location: String
  }],
  
  // Maintenance
  lastCleaned: Date,
  lastInspected: Date,
  nextInspectionDue: Date,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
barrelSchema.index({ barrelId: 1 });
barrelSchema.index({ qrCode: 1 });
barrelSchema.index({ status: 1 });
barrelSchema.index({ currentCustomer: 1 });
barrelSchema.index({ 'hangerSpace.location': 1 });
barrelSchema.index({ 'qrRequest.status': 1 });

// Methods
barrelSchema.methods.addHistory = function(action, status, userId, notes = '', location = '') {
  this.history.push({
    action,
    status,
    performedBy: userId,
    date: new Date(),
    notes,
    location
  });
  return this.save();
};

barrelSchema.methods.markReturned = function(userId) {
  this.status = 'returned_empty';
  this.returnedDate = new Date();
  this.addHistory('Barrel returned empty', 'returned_empty', userId);
  return this.save();
};

barrelSchema.methods.addToHanger = function(location, slot, userId) {
  this.status = 'in_hanger_space';
  this.hangerSpace = {
    location,
    slot,
    addedDate: new Date(),
    addedBy: userId
  };
  this.addHistory('Added to hanger space', 'in_hanger_space', userId, `Location: ${location}, Slot: ${slot}`);
  return this.save();
};

barrelSchema.methods.assignToCustomer = function(customerId, userId) {
  this.status = 'assigned_to_customer';
  this.currentCustomer = customerId;
  this.assignedDate = new Date();
  this.hangerSpace = undefined;
  this.addHistory('Assigned to customer', 'assigned_to_customer', userId);
  return this.save();
};

module.exports = mongoose.models.Barrel || mongoose.model('Barrel', barrelSchema);
