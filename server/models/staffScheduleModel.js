const mongoose = require('mongoose');

const staffScheduleSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  staffRole: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'full-day', 'night'],
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'completed', 'absent', 'cancelled'],
    default: 'assigned'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
staffScheduleSchema.index({ staffId: 1, date: 1 });
staffScheduleSchema.index({ date: 1 });
staffScheduleSchema.index({ shift: 1 });

module.exports = mongoose.model('StaffSchedule', staffScheduleSchema);
