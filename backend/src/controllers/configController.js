const settingsService = require('../services/settingsService');

// Public, unauthenticated configuration consumed by the web clients for branding
// and to render raffle parameters. Only non-sensitive values are exposed.
exports.getPublicConfig = async (_req, res, next) => {
  try {
    res.json(await settingsService.getPublicConfig());
  } catch (err) {
    next(err);
  }
};
