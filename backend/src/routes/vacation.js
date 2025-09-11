const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/database');
const { v4: uuid } = require('uuid');

const router = express.Router();

router.get('/', auth, async (req,res,next) => {
  try {
    const rows = await db('vacation_periods').where({ user_id: req.user.id }).orderBy('start_date','desc');
    res.json({ periods: rows });
  } catch (err) { next(err); }
});

router.post('/', auth, async (req,res,next) => {
  try {
    const { start_date, end_date, include_in_travel=false, paused_categories=[] } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required'});
    if (new Date(start_date) > new Date(end_date)) return res.status(400).json({ error: 'start_date must be before end_date'});
    // Overlap check
    const overlap = await db('vacation_periods')
      .where({ user_id: req.user.id })
      .where(function() {
        this.whereBetween('start_date', [start_date, end_date])
          .orWhereBetween('end_date', [start_date, end_date])
          .orWhere(function() { this.where('start_date','<=', start_date).andWhere('end_date','>=', end_date); });
      }).first();
    if (overlap) return res.status(409).json({ error: 'Overlap with existing vacation period' });
    const id = uuid();
    await db('vacation_periods').insert({ id, user_id: req.user.id, start_date, end_date, include_in_travel, paused_categories: JSON.stringify(paused_categories) });
    const row = await db('vacation_periods').where({ id }).first();
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req,res,next) => {
  try {
    await db('vacation_periods').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;