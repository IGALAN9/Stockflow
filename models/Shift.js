const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  bahanDasar: { type: Number, default: 0 },
  recycle: { type: Number, default: 0 },
  rollFiberStock: { type: Number, default: 0 },
  rollFiber: { type: Number, default: 0 },
  rollFiberDipakai: { type: Number, default: 0 },
  cupPlastik: { type: Number, default: 0 },
  recycleHasil: { type: Number, default: 0 },
  error1: { type: Number, default: 0 },
  error2: { type: Number, default: 0 },
  totalError: { type: Number, default: 0 },
  notes: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
