const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const { signAccessToken, generateRefreshToken, persistRefreshToken, rotateRefreshToken, revokeRefreshToken, detectReuseAndRevoke } = require('../utils/tokens');
const { AuthError, ValidationError } = require('../errors/AppError');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);
    const { email, password, firstName, lastName } = value;
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) throw new ValidationError('User already exists');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = require('uuid').v4();
    await db('users').insert({ id, email, password_hash: passwordHash, first_name: firstName, last_name: lastName });
    const accessToken = signAccessToken({ id, email });
    const refresh = generateRefreshToken();
    await persistRefreshToken(id, refresh, req.headers['user-agent'], req.ip);
    res.cookie('refresh_token', refresh, { httpOnly: true, sameSite: 'strict', secure: false, path: '/api/v1/auth' });
    res.status(201).json({ user: { id, email, firstName, lastName }, token: accessToken });
  } catch (err) { next(err); }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);
    const { email, password } = value;
    const user = await db('users').where({ email }).first();
    if (!user) throw new AuthError('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new AuthError('Invalid credentials');
    const accessToken = signAccessToken({ id: user.id, email: user.email });
    const refresh = generateRefreshToken();
    await persistRefreshToken(user.id, refresh, req.headers['user-agent'], req.ip);
    res.cookie('refresh_token', refresh, { httpOnly: true, sameSite: 'strict', secure: false, path: '/api/v1/auth' });
    res.json({ user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name }, token: accessToken });
  } catch (err) { next(err); }
});

// Refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw new AuthError('No refresh token');
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await db('refresh_tokens').where({ token_hash: tokenHash }).orderBy('created_at','desc').first();
    if (!stored || stored.revoked_at) throw new AuthError('Invalid refresh token');
    const user = await db('users').where({ id: stored.user_id }).first();
    if (!user) throw new AuthError('Invalid user');
    const rotated = await rotateRefreshToken(token, user.id, req.headers['user-agent'], req.ip);
    if (!rotated) throw new AuthError('Invalid refresh token');
    const newAccess = signAccessToken({ id: user.id, email: user.email });
    res.cookie('refresh_token', rotated.token, { httpOnly: true, sameSite: 'strict', secure: false, path: '/api/v1/auth' });
    res.json({ token: newAccess });
  } catch (err) { next(err); }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) await revokeRefreshToken(token);
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.first_name,
    lastName: req.user.last_name
  });
});

// List sessions (refresh tokens)
router.get('/sessions', auth, async (req, res, next) => {
  try {
    const rows = await db('refresh_tokens')
      .where({ user_id: req.user.id })
      .orderBy('created_at','desc')
      .select('id','created_at','revoked_at','replaced_by','user_agent','ip','last_used_at');
    res.json({ sessions: rows });
  } catch (err) { next(err); }
});

// Revoke a single session
router.delete('/sessions/:id', auth, async (req, res, next) => {
  try {
    await db('refresh_tokens').where({ id: req.params.id, user_id: req.user.id }).update({ revoked_at: new Date() });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
