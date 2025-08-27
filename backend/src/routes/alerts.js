const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/database');
const { v4: uuid } = require('uuid');

const router = express.Router();

router.get('/', auth, async (req,res,next) => {
  try {
    const alerts = await db('alerts').where({ user_id: req.user.id });
    res.json({ alerts });
  } catch (err) { next(err); }
});

router.post('/', auth, async (req,res,next) => {
  try {
    const { type, category_id, threshold, comparison = 'gte' } = req.body;
    const id = uuid();
    await db('alerts').insert({ id, user_id: req.user.id, type, category_id, threshold, comparison, status: 'active' });
    const alert = await db('alerts').where({ id }).first();
    res.status(201).json(alert);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req,res,next) => {
  try {
    const { threshold, comparison, status } = req.body;
    await db('alerts').where({ id: req.params.id, user_id: req.user.id }).update({ threshold, comparison, status, updated_at: new Date() });
    const alert = await db('alerts').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!alert) return res.status(404).json({ error: 'Not found' });
    res.json(alert);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req,res,next) => {
  try {
    await db('alerts').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id/events', auth, async (req,res,next) => {
  try {
    const events = await db('alert_events').where({ user_id: req.user.id }).andWhere('alert_id', req.params.id).orderBy('created_at','desc').limit(50);
    res.json({ events });
  } catch (err) { next(err); }
});

module.exports = router;