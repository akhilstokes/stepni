const mongoose = require('mongoose');

const returnBarrelRequestSchema = new mongoose.Schema(
  {
    // Request type: 'return' or 'barrel_id_request'
    requestType: {
      type: String,
      enum: ['return', 'barrel_id_request'],
      required: true
    },

    // Field staff who submitted the request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedByName: {
      type: String,
      required: true
    },

    // For return requests
    barrelIds: [{
      type: String
    }],

    // For barrel ID requests (when no scanner)
    numberOfBarrels: {
      type: Number,
      min: 1
    },

    // Reason for return
    reason: {
      type: String,
      enum: ['completed_route', 'damaged_barrels', 'excess_barrels', 'end_of_shift', 'other'],
      required: true
    },

    // Additional notes
    notes: {
      type: String,
      default: ''
    },

    // Request status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },

    // Admin who processed the request
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedByName: {
      type: String
    },
    processedAt: {
      type: Date
    },

    // For barrel ID requests - assigned barrel IDs by admin
    assignedBarrelIds: [{
      type: String
    }],

    // Rejection reason (if rejected)
    rejectionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
returnBarrelRequestSchema.index({ requestedBy: 1, status: 1 });
returnBarrelRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ReturnBarrelRequest', returnBarrelRequestSchema);
