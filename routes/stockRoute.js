const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const StockDetail = require('../models/stockDetail');
const { addStock } = require('../services/stockService');

// router.post('/add', async (req, res) => {
//   const { stockType, amount } = req.body;

//   try {
//     const updatedStock = await addStock(stockType, amount);
//     res.json(updatedStock);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

router.get('/stock', async (req, res) => {
  try {
    const stock = await Stock.findOne(); // ambil dokumen pertama
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ambil semua stok detail
router.get('/details', async (req, res) => {
  const jenis = req.query.jenis;
  const query = jenis ? { jenis } : {};
  const data = await StockDetail.find(query); // pakai Mongoose
  res.json(data);
});

// Hapus stok detail (dan kurangi total stok)
router.post('/delete', async (req, res) => {
  const ids = req.body.ids; // array of _id to delete

  const items = await StockDetail.find({ _id: { $in: ids } });

  let stock = await Stock.findOne(); // asumsi hanya ada 1 dokumen

  items.forEach(item => {
    const field = `stock_${item.jenis}`;
    stock[field] = Math.max(stock[field] - item.berat, 0);
  });

  await stock.save();
  await StockDetail.deleteMany({ _id: { $in: ids } });

  res.json({ success: true });
});

router.post('/add', async (req, res) => {
  const { jenis, merk, berat, tanggal } = req.body;

  if (!jenis || !merk || !berat || !tanggal) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  try {
    // 1. Tambah ke StockDetail
    await StockDetail.create({ jenis, merk, berat, tanggal });

    // 2. Tambah ke total di Stock
    const field = `stock_${jenis}`;
    let stock = await Stock.findOne();

    if (!stock) stock = await Stock.create({});

    stock[field] = (stock[field] || 0) + berat;
    await stock.save();

    res.json({ success: true });
  } catch (err) {
    console.error('GAGAL MENYIMPAN:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
