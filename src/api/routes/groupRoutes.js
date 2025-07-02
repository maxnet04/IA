const express = require('express');
const GroupController = require('../../controllers/GroupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const groupController = new GroupController();

// Obtém lista de todos os grupos
router.get('/', authMiddleware, (req, res) => groupController.getAllGroups(req, res));

// Obtém detalhes de um grupo específico
router.get('/:groupId', authMiddleware, (req, res) => groupController.getGroupDetails(req, res));

// Gera previsões de volume para um grupo
router.get('/:groupId/predict', authMiddleware, (req, res) => groupController.predictGroupVolume(req, res));

// Detecta anomalias em um grupo
router.get('/:groupId/anomalies', authMiddleware, (req, res) => groupController.detectGroupAnomalies(req, res));

// Gera recomendações para um grupo
router.get('/:groupId/recommendations', authMiddleware, (req, res) => groupController.generateGroupRecommendations(req, res));

// Obtém métricas de um grupo
router.get('/:groupId/metrics', authMiddleware, (req, res) => groupController.getGroupMetrics(req, res));

module.exports = router;
