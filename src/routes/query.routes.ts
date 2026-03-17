import express from 'express';
const router = express.Router();
import queryController from '../controllers/query.controller';

// get data from DB dynamically
router.get('/api/query/:queryId', queryController.getDataByQueryId);

export default router;