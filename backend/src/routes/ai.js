const express = require('express');
const AIService = require('../services/aiService');
const auth = require('../middleware/auth');

const router = express.Router();

// Process AI query
router.post('/chat', auth, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await AIService.processQuery(req.user.id, query);
    res.json(result);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

module.exports = router;
