const { Queue } = require('bullmq');
const { getRedis } = require('./redis');

const connection = () => {
  const redis = getRedis();
  if (!redis) return null;
  return { host: redis.options.host, port: redis.options.port };
};

function createQueue(name) {
  const conn = connection();
  if (!conn) return null;
  return new Queue(name, { connection: conn });
}

const emailQueue = () => createQueue('email');
const drawQueue = () => createQueue('draw');
const reminderQueue = () => createQueue('reminder');
const cleanupQueue = () => createQueue('cleanup');

module.exports = { emailQueue, drawQueue, reminderQueue, cleanupQueue, connection };
