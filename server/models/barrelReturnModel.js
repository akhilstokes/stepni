const mongoose = require('mongoose');

const barrelReturnSchema = new mongoose.Schema({
  barrels: [{
    barrelId: {
      type: String,
      required: true
    },
    scannedAt: {
      type: Date,
      required: true
    },
    scannedBy: {
      type: String,
      required: true
    }
  }],
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedAt: {
    type: Date,
    required: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  returnReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['returned', 'reassigned', 'completed'],
    default: 'returned'
  },
  reassignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reassignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reassignedAt: {
    type: Date
  },
  reassignReason: {
    type: String
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
barrelReturnSchema.index({ returnedBy: 1, createdAt: -1 });
barrelReturnSchema.index({ reassignedTo: 1, status: 1 });
barrelReturnSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BarrelReturn', barrelReturnSchema);
