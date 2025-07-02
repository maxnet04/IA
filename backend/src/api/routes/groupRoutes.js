const express = require('express');
const groupController = require('../../controllers/GroupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rotas principais para grupos
router.get('/', authMiddleware, (req, res) => groupController.getAllGroups(req, res));
router.get('/:groupId', authMiddleware, (req, res) => groupController.getGroupDetails(req, res));
router.get('/:groupId/predict', authMiddleware, (req, res) => groupController.predictGroupVolume(req, res));
router.get('/:groupId/anomalies', authMiddleware, (req, res) => groupController.detectGroupAnomalies(req, res));
router.get('/:groupId/recommendations', authMiddleware, (req, res) => groupController.generateGroupRecommendations(req, res));
router.get('/:groupId/metrics', authMiddleware, (req, res) => groupController.getGroupMetrics(req, res));

// Rotas adicionais implementadas no controller
router.get('/:groupId/historical', authMiddleware, (req, res) => groupController.getGroupHistoricalData(req, res));
router.get('/:groupId/volume-history', authMiddleware, (req, res) => groupController.getGroupVolumeHistory(req, res));
router.get('/:groupId/aggregated-metrics', authMiddleware, (req, res) => groupController.getGroupAggregatedMetrics(req, res));
router.get('/:groupId/data-by-category', authMiddleware, (req, res) => groupController.getGroupDataByCategory(req, res));

module.exports = router; 