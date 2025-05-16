const mongoose = require('mongoose');

const stockDetailSchema = new mongoose.Schema({
  jenis: { type: String, required: true, enum: ['bahan_murni', 'fiber', 'recycle', 'cup'] },
  merk: { type: String, required: true },
  berat: { type: Number, required: true },
  tanggal: { type: Date, required: true }
});

module.exports = mongoose.model('StockDetail', stockDetailSchema);