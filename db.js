const mongoose = require('mongoose');
require('dotenv').config(); // untuk membaca dari .env file

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

module.exports = connectToDB;
