const mongoose = require('mongoose');

const hangerSpaceSchema = new mongoose.Schema({
  // Location identification
  location: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  
  // Capacity
  totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
  occupiedSlots: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Slots detail
  slots: [{
    slotNumber: {
      type: String,
      required: true
    },
    isOccupied: {
      type: Boolean,
      default: false
    },
    barrel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barrel'
    },
    addedDate: Date,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  description: String,
  notes: String,
  
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

// Virtual for available slots
hangerSpaceSchema.virtual('availableSlots').get(function() {
  return this.totalSlots - this.occupiedSlots;
});

// Indexes
hangerSpaceSchema.index({ location: 1 });
hangerSpaceSchema.index({ isActive: 1 });

// Methods
hangerSpaceSchema.methods.addBarrel = function(slotNumber, barrelId, userId) {
  const slot = this.slots.find(s => s.slotNumber === slotNumber);
  
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (slot.isOccupied) {
    throw new Error('Slot is already occupied');
  }
  
  slot.isOccupied = true;
  slot.barrel = barrelId;
  slot.addedDate = new Date();
  slot.addedBy = userId;
  
  this.occupiedSlots += 1;
  this.updatedBy = userId;
  
  return this.save();
};

hangerSpaceSchema.methods.removeBarrel = function(slotNumber, userId) {
  const slot = this.slots.find(s => s.slotNumber === slotNumber);
  
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (!slot.isOccupied) {
    throw new Error('Slot is already empty');
  }
  
  const barrelId = slot.barrel;
  
  slot.isOccupied = false;
  slot.barrel = null;
  slot.addedDate = null;
  slot.addedBy = null;
  
  this.occupiedSlots -= 1;
  this.updatedBy = userId;
  
  return this.save().then(() => barrelId);
};

hangerSpaceSchema.methods.getAvailableSlots = function() {
  return this.slots.filter(s => !s.isOccupied);
};

// Static method to get total available capacity
hangerSpaceSchema.statics.getTotalAvailableCapacity = async function() {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalSlots: { $sum: '$totalSlots' },
        occupiedSlots: { $sum: '$occupiedSlots' }
      }
    }
  ]);
  
  if (result.length === 0) {
    return { totalSlots: 0, occupiedSlots: 0, availableSlots: 0 };
  }
  
  const { totalSlots, occupiedSlots } = result[0];
  return {
    totalSlots,
    occupiedSlots,
    availableSlots: totalSlots - occupiedSlots
  };
};

module.exports = mongoose.models.HangerSpace || mongoose.model('HangerSpace', hangerSpaceSchema);
