const { app, BrowserWindow } = require('electron');
const path = require('path');
const connectToDB = require('./db');
const User = require('./models/User');
const Shift = require('./models/Shift');
const Stock = require('./models/Stock');
require('dotenv').config(); 

async function migrateInitialData() {
  const users = await User.find();
  if (users.length === 0) {
    const admin = await User.create({ name: 'Admin User', role: 'admin' });
    await Shift.create({
      userId: admin._id,
      date: new Date(),
      shiftType: 'morning'
    });
    await Stock.create({
      stock_bahan_murni: 50,
      stock_fiber: 50,
      stock_recycle: 50,
      stock_cup: 50
    });
    console.log('✅ Initial data migrated');
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  win.loadFile('./Frontend/Login/login.html');

  win.webContents.once('did-finish-load', async () => {
    await migrateInitialData();
    win.webContents.send('migration-complete', 'Migration done or skipped');
  });
}

app.whenReady().then(async () => {
  await connectToDB();   
  await createWindow();
});
