const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  logger.info('MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectDatabase };
