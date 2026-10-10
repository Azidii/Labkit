const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');

// Fix for Windows/ISP DNS resolution issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load environment variables from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }

    const conn = await mongoose.connect(mongoUri, {
      autoSelectFamily: false,
      serverSelectionTimeoutMS: 10000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

// If executed directly (e.g. `node database/mongo-dbconnect.js`)
if (require.main === module) {
  connectDB()
    .then(() => {
      console.log('Database connection check passed.');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
