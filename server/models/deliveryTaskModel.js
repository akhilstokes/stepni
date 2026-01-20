const mongoose = require('mongoose');

const deliveryTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pickupAddress: { type: String, required: true },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  dropAddress: { type: String, required: true },
  scheduledAt: { type: Date, required: false },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pickup_scheduled','enroute_pickup','picked_up','enroute_drop','delivered','cancelled'],
    default: 'pickup_scheduled',
    index: true
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Add geospatial index for location-based queries
deliveryTaskSchema.index({ pickupLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryTask', deliveryTaskSchema);
