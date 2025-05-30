const { app, BrowserWindow } = require('electron');
const mongoose = require('mongoose');
const path = require('path');
const connectToDB = require('./db');
const User = require('./models/User');
const Shift = require('./models/Shift');
const { ipcMain } = require('electron');
const { getUserById } = require('./models/User.js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { connect } = require('http2');
const Stock = require('./models/Stock');
const StockDetail = require('./models/stockDetail');
const { profile } = require('console');
global.loggedInUser = null;
const fs = require('fs');
const os = require('os');
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
      contextIsolation: true,
      sandbox: true
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

ipcMain.handle('getCurrentUser', async (event)=> {
  const win = BrowserWindow.fromWebContents(event.sender);
  return global.loggedInUser || null;
});

ipcMain.handle('login', async(event, {username, password}) => {
  const user = await User.findOne({username});
  if(user) {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash); 
    if (isPasswordValid){
      const win = BrowserWindow.fromWebContents(event.sender);
      const sessionUser = {
        id: user._id.toString(),
        username: user.username,
        fullName: user.full_name,
        profile_photo : user.profile_photo
      };

      global.loggedInUser = sessionUser;
      win.sessionUser = sessionUser;
      return { success: true, user:global.loggedInUser };
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
    const shifts = await Shift.find().populate('creator').sort({ createdAt: -1 }).lean();
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

ipcMain.handle('updateProfilePicture', async (event, { userID, buffer, fileName }) => {
  try {
    const saveDir = path.join(os.homedir(), 'Stockflow', 'profile_photos');
    console.log('Save directory:', saveDir);

    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
    console.log('Folder created:', saveDir);

    const savePath = path.join(saveDir, fileName);
    console.log('Saving file to:', savePath);

    fs.writeFileSync(savePath, Buffer.from(buffer));
    console.log('File saved');

    await User.updateOne({ _id: userID }, { $set: { profile_photo: savePath } });
    console.log('DB updated with new profile photo path');

    return { success: true };
  } catch (err) {
    console.error('Error update profile picture:', err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('changeFullName', async (event,{ userID, newFullName }) => {
  try{
    const user = await User.findById(userID);
    if (!user) return {success: false, message: 'User not found'};

    user.full_name = newFullName;
    await user.save();

    return {success: true, message : 'Full name updated'};

  } catch (error){
    console.error('Change full name error', error);
    return {success: false, message : 'Server error'};
  }
});

ipcMain.handle('refresh-current-user', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const sessionUser = win?.sessionUser;

  if (!sessionUser || !sessionUser.id) return null;

  const freshUser = await User.findById(sessionUser.id); 

  const updated = {
    id: freshUser._id.toString(),
    username: freshUser.username,
    fullName: freshUser.full_name,
    profile_photo: freshUser.profile_photo
  };

  win.sessionUser = updated;
  global.loggedInUser = updated; 

  return updated;
});

ipcMain.handle('logout', async (event) => {
  try {
    global.loggedInUser = null;
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Logout failed' };
  }
});