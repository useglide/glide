const express = require('express');
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Synchronize Firestore data with the latest information
router.post('/sync-firestore', authMiddleware, syncController.syncFirestoreData);

module.exports = router;
