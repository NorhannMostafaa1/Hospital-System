const mongoose = require('mongoose');

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri || uri.startsWith('postgres')) {
    console.warn('MongoDB URI is not configured. Set MONGODB_URI in .env.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }
};

module.exports = { connectDatabase };
