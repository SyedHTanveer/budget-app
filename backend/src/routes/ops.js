const express = require('express');
const { db } = require('../config/database');
const { getQueue } = require('../queue/bullmq');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/health', auth, async (req,res) => {
  try {
    await db.raw('select 1');
    res.json({ ok: true, db: 'up', timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', error: err.message });
  }
});

router.get('/queues', auth, async (req,res) => {
  try {
    const names = ['plaid','export','alerts','rollover'];
    const stats = {};
    for (const n of names) {
      try {
        const q = getQueue(n);
        const counts = await q.getJobCounts();
        stats[n] = counts;
      } catch (e) {
        stats[n] = { error: e.message };
      }
    }
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;