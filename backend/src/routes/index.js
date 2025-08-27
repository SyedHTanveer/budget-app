const express = require('express');
const router = express.Router();

// Import the goals controller
const goalsController = require('../controllers/goalsController');

// Define the routes for goals
router.get('/', goalsController.getAllGoals);
router.post('/', goalsController.createGoal);
router.get('/:id', goalsController.getGoalById);
router.put('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);

// Mount user preferences and ops routes if not already mounted.
const userPreferences = require('./userPreferences');
const ops = require('./ops');

router.use('/preferences', userPreferences);
router.use('/ops', ops);

module.exports = router;