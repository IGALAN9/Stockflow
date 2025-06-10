const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}


let mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      mongoUri = config.MONGO_URI;
    }
  } catch (err) {
    console.error('❌ Failed to load config.json:', err);
  }
}

async function connectToDB() {
  if (!mongoUri) {
    console.error('❌ No MongoDB URI found in .env or config.json');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

module.exports = connectToDB;
