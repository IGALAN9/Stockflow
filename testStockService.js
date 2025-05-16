const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const { addStock, decreaseStock } = require('./services/stockService');
require('dotenv').config(); // untuk membaca dari .env file

async function runTests() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGO_URI, {
    });

    console.log('Connected to MongoDB for testing.');

    // Ensure a Stock document exists or create one
    let stock = await Stock.findOne();
    if (!stock) {
      stock = new Stock();
      await stock.save();
      console.log('Created initial Stock document.');
    }

    console.log('Initial stock:', stock);

    // Test addStock
    console.log('Testing addStock...');
    let updatedStock = await addStock('stock_bahan_murni', 10);
    console.log('After adding 10 to stock_bahan_murni:', updatedStock);

    // Test decreaseStock
    console.log('Testing decreaseStock...');
    updatedStock = await decreaseStock('stock_bahan_murni', 5);
    console.log('After decreasing 5 from stock_bahan_murni:', updatedStock);

    // Test decreaseStock with insufficient stock (should throw error)
    try {
      await decreaseStock('stock_bahan_murni', 1000);
    } catch (err) {
      console.log('Expected error on insufficient stock:', err.message);
    }

    // Test invalid stockType (should throw error)
    try {
      await addStock('invalid_stock_type', 5);
    } catch (err) {
      console.log('Expected error on invalid stock type:', err.message);
    }

    // Test negative amount (should throw error)
    try {
      await addStock('stock_fiber', -5);
    } catch (err) {
      console.log('Expected error on negative amount:', err.message);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed. Tests completed.');

  } catch (error) {
    console.error('Error during tests:', error);
  }
}

runTests();