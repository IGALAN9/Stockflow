const { app, BrowserWindow, ipcMain } = require('electron');
const mongoose = require('mongoose');
const path = require('path');

let isDbConnected = false;

async function connectToDB() {
  try {
    await mongoose.connect('mongodb+srv://admin:admin@stockcluster.ntcp7r6.mongodb.net/?retryWrites=true&w=majority&appName=stockCluster', {
    });
    isDbConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    isDbConnected = false;
    console.error('❌ MongoDB Connection Failed:', error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(async () => {
  await connectToDB();
  createWindow();
});

ipcMain.handle('get-db-status', () => {
  return isDbConnected;
});
