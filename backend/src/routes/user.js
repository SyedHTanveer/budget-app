const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/database');
const { v4: uuid } = require('uuid');
const { ValidationError } = require('../errors/AppError');
const { audit } = require('../utils/audit');

const router = express.Router();

// Schedule account delete (stub immediate delete for now)
router.delete('/', auth, async (req, res, next) => {
  try {
    await db.transaction(async trx => {
      await trx('refresh_tokens').where({ user_id: req.user.id }).del();
      await trx('ai_chat_usage').where({ user_id: req.user.id }).del();
      await trx('plaid_items').where({ user_id: req.user.id }).del();
      await trx('accounts').where({ user_id: req.user.id }).del();
      await trx('transactions').where({ user_id: req.user.id }).del();
      await trx('budget_categories').where({ user_id: req.user.id }).del().catch(()=>{});
      await trx('goals').where({ user_id: req.user.id }).del();
      await trx('vacation_periods').where({ user_id: req.user.id }).del().catch(()=>{});
      await trx('user_budget_prefs').where({ user_id: req.user.id }).del().catch(()=>{});
      await trx('users').where({ id: req.user.id }).del();
    });
    await audit(req.user.id, 'user.delete', {});
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
