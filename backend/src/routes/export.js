const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/database');
const { v4: uuid } = require('uuid');
const { enqueue } = require('../queue/bullmq');
const { toCSV } = require('../utils/csv');
const { logger } = require('../logger');

const router = express.Router();

// Enqueue export job
router.post('/', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Prevent multiple pending jobs
    const existing = await db('export_jobs').where({ user_id: userId }).whereIn('status', ['pending','processing']).first();
    if (existing) return res.json({ jobId: existing.id, status: existing.status });

    const id = uuid();
    await db('export_jobs').insert({ id, user_id: userId, status: 'pending', filename: `export_${Date.now()}.zip`, mime_type: 'application/zip' });
    await enqueue('export', 'generate_user_export', { jobId: id, userId });
    logger.info({ jobId: id, userId }, 'export job enqueued');
    res.status(202).json({ jobId: id, status: 'pending' });
  } catch (err) { next(err); }
});

// List recent jobs
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = await db('export_jobs').where({ user_id: req.user.id }).orderBy('created_at','desc').limit(10).select('id','status','created_at','completed_at','bytes','filename');
    res.json({ jobs: rows });
  } catch (err) { next(err); }
});

// Job status
router.get('/:id/status', auth, async (req, res, next) => {
  try {
    const job = await db('export_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json({ id: job.id, status: job.status, error: job.error, bytes: job.bytes, created_at: job.created_at, completed_at: job.completed_at });
  } catch (err) { next(err); }
});

// Download
router.get('/:id/download', auth, async (req, res, next) => {
  try {
    const job = await db('export_jobs').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.status !== 'complete') return res.status(409).json({ error: 'Not ready' });
    const buffer = Buffer.from(job.zip_base64, 'base64');
    await db('export_jobs').where({ id: job.id }).update({ downloaded_at: new Date() });
    res.setHeader('Content-Type', job.mime_type || 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${job.filename || 'export.zip'}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;
