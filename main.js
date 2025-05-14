const { app, BrowserWindow } = require('electron');
const path = require('path');
const connectToDB = require('./db');
const User = require('./models/User');
const Shift = require('./models/Shift');
const { ipcMain } = require('electron');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { connect } = require('http2');
require('dotenv').config(); 

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
