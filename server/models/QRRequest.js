const mongoose = require('mongoose');

const qrRequestSchema = new mongoose.Schema({
  // Request details
  requestNumber: {
    type: String,
    required: true,
    unique: true
  },
  numberOfBarrels: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  
  // Requester information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  reason: {
    type: String,
    enum: ['qr_damaged', 'qr_missing', 'qr_unreadable', 'new_barrel', 'other'],
    default: 'qr_missing'
  },
  notes: String,
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    required: true
  },
  
  // Approval information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  rejectionReason: String,
  
  // Generated QR codes
  generatedQRs: [{
    barrelId: String,
    qrCode: String,
    qrCodeUrl: String,
    generatedDate: Date,
    attached: {
      type: Boolean,
      default: false
    },
    attachedDate: Date,
    attachedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Completion tracking
  completedDate: Date,
  allQRsAttached: {
    type: Boolean,
    default: false
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
qrRequestSchema.index({ requestNumber: 1 });
qrRequestSchema.index({ requestedBy: 1 });
qrRequestSchema.index({ status: 1 });
qrRequestSchema.index({ requestedDate: -1 });

// Pre-save middleware to generate request number
qrRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Count requests today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await this.constructor.countDocuments({
      requestedDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    this.requestNumber = `QRR-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Methods
qrRequestSchema.methods.approve = function(adminId) {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedDate = new Date();
  return this.save();
};

qrRequestSchema.methods.reject = function(adminId, reason) {
  this.status = 'rejected';
  this.approvedBy = adminId;
  this.approvedDate = new Date();
  this.rejectionReason = reason;
  return this.save();
};

qrRequestSchema.methods.addGeneratedQR = function(barrelId, qrCode, qrCodeUrl) {
  this.generatedQRs.push({
    barrelId,
    qrCode,
    qrCodeUrl,
    generatedDate: new Date(),
    attached: false
  });
  
  // Check if all QRs are generated
  if (this.generatedQRs.length === this.numberOfBarrels) {
    this.status = 'completed';
    this.completedDate = new Date();
  }
  
  return this.save();
};

qrRequestSchema.methods.markQRAttached = function(qrCode, userId) {
  const qr = this.generatedQRs.find(q => q.qrCode === qrCode);
  if (qr) {
    qr.attached = true;
    qr.attachedDate = new Date();
    qr.attachedBy = userId;
    
    // Check if all QRs are attached
    this.allQRsAttached = this.generatedQRs.every(q => q.attached);
  }
  return this.save();
};

module.exports = mongoose.models.QRRequest || mongoose.model('QRRequest', qrRequestSchema);
