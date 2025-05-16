const express = require('express');
const app = express();
const stockRoutes = require('./routes/stockRoute');
const mongoose = require('mongoose');
const cors = require('cors');
app.use(cors());
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {}); 

app.use(express.json());
app.use('/api/stocks', stockRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
