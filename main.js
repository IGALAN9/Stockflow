const { app, BrowserWindow } = require('electron');
const mongoose = require('mongoose');
const path = require('path');
const connectToDB = require('./db');
const User = require('./models/User');
const Shift = require('./models/Shift');
const { ipcMain } = require('electron');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { connect } = require('http2');
const Stock = require('./models/Stock');
const StockDetail = require('./models/StockDetail');
require('dotenv').config(); 
require('./app.js');

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
      stock_bahan_murni: 0,
      stock_fiber: 0,
      stock_recycle: 0,
      stock_cup: 0
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

ipcMain.handle('login', async(event, {username, password}) => {
  const user = await User.findOne({username});
  if(user) {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash); 
    if (isPasswordValid){
      return { success: true, username: user.username };
    } 
    else {
      return { success: false, message: 'Incorrect password!' };
    } 
  } else {
      return { success: false, message: 'User not found!' };
    }
});

ipcMain.on('redirect-to-dashboard', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if(win){
    win.loadFile('./Frontend/index.html');
  }
});

ipcMain.handle('reset-password', async (event, { username, newPassword }) => {
  const user = await User.findOne({ username });
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hashed;
  await user.save();

  return { success: true, message: 'Password updated successfully' };
});

ipcMain.handle('save-shift', async (event, shiftData) => {
  try {
    const newShift = new Shift(shiftData);
    await newShift.save();

    // 🔽 Update stock total
    const stock = await Stock.findOne();
    if (!stock) throw new Error('Stock document not found');

    stock.stock_bahan_murni -= shiftData.bahanDasar;
    stock.stock_recycle     = stock.stock_recycle - (shiftData.recycle || 0) + (shiftData.recycleHasil || 0);
    stock.stock_fiber       = stock.stock_fiber - (shiftData.rollFiberStock || 0) + ((shiftData.rollFiber || 0) - (shiftData.rollFiberDipakai || 0));
    stock.stock_cup         += shiftData.cupPlastik;
    

    await stock.save();

    // 📝 Simpan histori perubahan ke StockDetail
    const today = new Date();

    const details = [
      { jenis: 'bahan_murni', merk: 'Shift', berat: -shiftData.bahanDasar, tanggal: today },
      { jenis: 'recycle', merk: 'Shift', berat: -shiftData.recycle, tanggal: today },
      { jenis: 'fiber', merk: 'Shift', berat: -shiftData.rollFiberStock, tanggal: today },
      { jenis: 'cup', merk: 'Shift', berat: -shiftData.cupPlastik, tanggal: today }
    ];

    await StockDetail.insertMany(details);

    return { success: true, message: 'Shift saved & stock updated' };
  } catch (error) {
    console.error('Error saving shift or updating stock:', error);
    return { success: false, message: 'Failed to save shift or update stock', error: error.message };
  }
});


ipcMain.handle('get-shifts', async () => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 }).lean();
    return { success: true, shifts };
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return { success: false, message: 'Failed to fetch shifts' };
  }
});

ipcMain.handle('delete-shifts', async (event, shiftIds) => {
  try {
    const objectIds = shiftIds
      .filter(id => typeof id === 'string' && id.length === 24)
      .map(id => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return { success: false, message: 'Tidak ada ID valid untuk dihapus' };
    }

    await Shift.deleteMany({ _id: { $in: objectIds } });
    return { success: true };
  } catch (error) {
    console.error('Error deleting shifts:', error);
    return { success: false, message: error.message };
  }
});