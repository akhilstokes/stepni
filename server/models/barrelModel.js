const mongoose = require('mongoose');

// Expanded barrel schema to support logistics and prediction features
const barrelSchema = new mongoose.Schema(
  {
    barrelId: { type: String, required: true, unique: true, index: true },
    capacity: { type: Number, required: true, min: 1 }, // liters
    currentVolume: { type: Number, default: 0, min: 0 }, // liters
    status: { type: String, enum: ['in-use', 'in-storage', 'disposed', 'picked_up', 'delivered', 'damaged', 'in_transit'], default: 'in-storage' },
    // Allocation owner (user/farmer) if assigned out by manager
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Additive fields for damage/repair workflow
    baseWeight: { type: Number },
    emptyWeight: { type: Number },
    lumbPercent: { type: Number, default: 0, min: 0, max: 100 },
    condition: { type: String, enum: ['ok', 'faulty', 'damaged', 'repair', 'lumb-removal', 'awaiting-approval', 'scrap'], default: 'ok' },
    damageType: { type: String, enum: ['none', 'lumbed', 'physical', 'other'], default: 'none' },
    currentLocation: { type: String, enum: ['factory', 'field', 'repair-bay', 'lumb-bay', 'scrap-yard', ''], default: 'factory' },

    // Material metadata for FEFO and search
    materialName: { type: String, default: '' },
    batchNo: { type: String, default: '' },
    manufactureDate: { type: Date },
    expiryDate: { type: Date },
    unit: { type: String, default: 'L' }, // liters by default

    purchaseDate: { type: Date, default: Date.now },
    disposalRequested: { type: Boolean, default: false },
    purchaseApproved: { type: Boolean, default: true },

    lastKnownLocation: { type: String, default: '' },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,

    // Historical readings to analyze fill trends
    readings: [
      { timestamp: { type: Date, default: Date.now }, volume: { type: Number, required: true, min: 0 } },
    ],

    // Field staff tracking fields
    lastScannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastScannedAt: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      timestamp: { type: Date }
    },
    trackingHistory: [{
      scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String },
      location: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Barrel', barrelSchema);