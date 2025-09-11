const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

const defaultPrefs = () => ({
  theme: 'system',
  default_currency: 'USD',
  ai_opt_in: true,
  redaction_level: 'standard',
  notifications_email: true,
  notifications_push: false
});

router.get('/', auth, async (req,res) => {
  try {
    let prefs = await db('user_preferences').where({ user_id: req.user.id }).first();
    if (!prefs) {
      const base = { user_id: req.user.id, ...defaultPrefs() };
      await db('user_preferences').insert(base);
      prefs = base;
    }
    res.json({ preferences: prefs });
  } catch (e) {
    console.error('Get prefs error', e); res.status(500).json({ error: 'Failed to get preferences' });
  }
});

router.put('/', auth, async (req,res) => {
  try {
    const allowed = ['theme','default_currency','ai_opt_in','redaction_level','notifications_email','notifications_push'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'No fields to update' });
    patch.updated_at = new Date().toISOString();
    const exists = await db('user_preferences').where({ user_id: req.user.id }).first();
    if (!exists) {
      await db('user_preferences').insert({ user_id: req.user.id, ...defaultPrefs(), ...patch });
    } else {
      await db('user_preferences').where({ user_id: req.user.id }).update(patch);
    }
    const preferences = await db('user_preferences').where({ user_id: req.user.id }).first();
    res.json({ preferences });
  } catch (e) {
    console.error('Update prefs error', e); res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
