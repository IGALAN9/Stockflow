const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock_bahan_murni: { type: Number, required: true, default: 0 },
  stock_fiber: { type: Number, required: true, default: 0 },
  stock_recycle: { type: Number, required: true, default: 0 },
  stock_cup: { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model('Stock', stockSchema);
