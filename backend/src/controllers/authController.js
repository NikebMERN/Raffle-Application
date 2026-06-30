const authService = require('../services/authService');
const authConfig = require('../config/auth');

function setTokenCookies(res, tokens) {
  res.cookie('access_token', tokens.accessToken, { ...authConfig.cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', tokens.refreshToken, { ...authConfig.cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

exports.register = async (req, res, next) => {
  try {
    const tokens = await authService.register(req.body, req.ip);
    setTokenCookies(res, tokens);
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const tokens = await authService.login(
      req.body.email,
      req.body.password,
      req.body.twoFactorCode,
      req.ip,
      req.headers['user-agent'],
    );
    setTokenCookies(res, tokens);
    res.json({ message: 'Login successful' });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('access_token', authConfig.cookieOptions);
  res.clearCookie('refresh_token', authConfig.cookieOptions);
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const result = await authService.setup2FA(req.user._id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.enable2FA = async (req, res, next) => {
  try {
    const result = await authService.enable2FA(req.user._id, req.body.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
