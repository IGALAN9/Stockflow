const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {type: String, required:true, unique:true},
  username: { type: String, required: true, unique: true},
  full_name: {type: String, default: ''},
  passwordHash: {type: String, required:true},
  profile_photo: {type:String, default: ''},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
