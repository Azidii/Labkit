const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');

// Fix for Windows local ISP DNS resolution issues with MongoDB Atlas SRV records
// ONLY run in local Windows dev when NOT running on Vercel/cloud serverless
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('DNS server override skipped:', err.message);
  }
}

// Load environment variables from .env if present
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Cache connection promise across serverless function invocations
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  // If connection is already alive, reuse it
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // If a connection promise is in-flight and connection not disconnected, await it
  if (cached.promise && mongoose.connection.readyState !== 0) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
    }
  }

  const dbName = process.env.MONGODB_DB_NAME || 'labkit';

  const options = {
    dbName,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 1,
    autoIndex: process.env.NODE_ENV !== 'production'
  };

  cached.promise = mongoose.connect(mongoUri, options).then((m) => {
    console.log(`✅ MongoDB Connected successfully to database "${m.connection.name}" (${m.connection.host})`);
    return m.connection;
  });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

// If executed directly (e.g. `node database/mongo-dbconnect.js`)
if (require.main === module) {
  connectDB()
    .then((conn) => {
      console.log(`Database connection check passed. DB: ${conn.name}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Check failed:', err);
      process.exit(1);
    });
}

