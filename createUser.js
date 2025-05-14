// createUser.js
const connectToDB = require('./db');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createUser(username, full_name, password) {
  try {
    await connectToDB();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`ℹ️ User "${username}" already exists.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      user_id: uuidv4(),
      username,
      full_name,
      passwordHash: hashedPassword
    });

    console.log('User created:', newUser);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(); 
  }
}

createUser('DDonny', 'Tanu Sudonny', 'donny123');