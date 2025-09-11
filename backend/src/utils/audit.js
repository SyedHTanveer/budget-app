const { db } = require('../config/database');
const { v4: uuid } = require('uuid');

async function audit(userId, action, meta = {}) {
  try {
    await db('audit_logs').insert({ id: uuid(), user_id: userId, action, meta: JSON.stringify(meta) });
  } catch (_) {}
}

module.exports = { audit };