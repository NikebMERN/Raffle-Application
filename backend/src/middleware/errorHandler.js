const logger = require('../config/logger');

function errorHandler(err, req, res, _next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry', field: Object.keys(err.keyPattern || {})[0] });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;
