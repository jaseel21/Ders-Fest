require('dotenv').config();  // Import dotenv to load variables from .env file
const mongoose = require('mongoose');

const state = {
  db: null,
};

const url = process.env.MONGO_URI; // MongoDB URI from .env
const dbName = process.env.DB_NAME; // Database name from .env

// Function to establish MongoDB connection
const connect = async (cb) => {
  try {
    const connection = await mongoose.connect(`${url}/${dbName}`);
    state.db = connection.connection.db;
    console.log(`Connected to MongoDB: ${dbName}`);
    cb(); // Callback after successful connection
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
