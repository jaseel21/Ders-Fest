require('dotenv').config(); // Load .env variables
const mongoose = require('mongoose');

const state = {
  db: null,
};

const url = process.env.MONGO_URI; // MongoDB URI with database name

// Function to establish MongoDB connection
const connect = async (cb) => {
  try {
    const connection = await mongoose.connect(url);
    state.db = connection.connection.db;
    console.log(`Connected to MongoDB`);
    cb(); // Callback on success
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    cb(err); // Callback with error
  }
};

// Function to get the database instance
const get = () => state.db;

module.exports = {
  connect,
  get,
};