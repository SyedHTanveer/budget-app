const { db } = require('../src/config/database');
const { generateRefreshToken, persistRefreshToken, rotateRefreshToken, detectReuseAndRevoke, signAccessToken } = require('../src/utils/tokens');
const { v4: uuid } = require('uuid');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretkeytestsecretkey123456';

describe('Refresh token reuse detection', () => {
  test('reuse revoked token triggers revoke all', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    const t1 = generateRefreshToken();
    const { id: id1 } = await persistRefreshToken(userId, t1, 'UA', '127.0.0.1');
    const r1 = await rotateRefreshToken(t1, userId, 'UA', '127.0.0.1');
    // Attempt to rotate again with old token (reuse)
    const crypto = require('crypto');
    const hashOld = crypto.createHash('sha256').update(t1).digest('hex');
    const existing = await db('refresh_tokens').where({ token_hash: hashOld }).first();
    // existing.revoked_at should be set
    expect(existing.revoked_at).toBeTruthy();
    const reused = await detectReuseAndRevoke(hashOld, userId);
    expect(reused).toBe(true);
    const remainingActive = await db('refresh_tokens').where({ user_id: userId, revoked_at: null });
    expect(remainingActive.length).toBe(0);
  });
});