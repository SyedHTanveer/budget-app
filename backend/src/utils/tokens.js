const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { loadEnv } = require('../config/env');
const { v4: uuid } = require('uuid');

const env = loadEnv();

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m` });
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

async function persistRefreshToken(userId, token, userAgent, ip) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const id = uuid();
  const expiresAt = new Date(Date.now() + parseInt(env.REFRESH_TOKEN_TTL_DAYS,10) * 24 * 60 * 60 * 1000);
  await db('refresh_tokens').insert({ id, user_id: userId, token_hash: hash, expires_at: expiresAt, user_agent: userAgent?.slice(0,255), ip });
  return { id, token, expiresAt };
}

async function rotateRefreshToken(prevToken, userId, userAgent, ip) {
  const prevHash = crypto.createHash('sha256').update(prevToken).digest('hex');
  const existing = await db('refresh_tokens').where({ token_hash: prevHash, user_id: userId, revoked_at: null }).first();
  if (!existing) return null;
  const newToken = generateRefreshToken();
  const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
  const expiresAt = new Date(Date.now() + parseInt(env.REFRESH_TOKEN_TTL_DAYS,10) * 24 * 60 * 60 * 1000);
  const newId = uuid();
  await db.transaction(async trx => {
    await trx('refresh_tokens').where({ id: existing.id }).update({ revoked_at: new Date(), replaced_by: newId });
    await trx('refresh_tokens').insert({ id: newId, user_id: userId, token_hash: newHash, expires_at: expiresAt, user_agent: userAgent?.slice(0,255), ip });
  });
  return { token: newToken, expiresAt };
}

async function revokeRefreshToken(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await db('refresh_tokens').where({ token_hash: hash }).update({ revoked_at: new Date() });
}

// Detect refresh token reuse: if a revoked token hash is seen again, revoke all active tokens for the user.
async function detectReuseAndRevoke(tokenHash, userId) {
  const token = await db('refresh_tokens').where({ token_hash: tokenHash, user_id: userId }).first();
  if (!token) return false; // nothing to do
  if (token.revoked_at) {
    // Reuse detected – revoke all active tokens for the user
    await db('refresh_tokens').where({ user_id: userId, revoked_at: null }).update({ revoked_at: new Date() });
    return true;
  }
  return false;
}

module.exports = { signAccessToken, generateRefreshToken, persistRefreshToken, rotateRefreshToken, revokeRefreshToken, detectReuseAndRevoke };
