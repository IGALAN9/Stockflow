const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  shiftType: { type: String, enum: ['morning', 'afternoon', 'night'], required: true }
});

module.exports = mongoose.model('Shift', shiftSchema);
