const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController.ts');

// get data from DB dynamically
router.get('/api/query/:queryId', queryController.getDataByQueryId);

module.exports = router;