const express = require('express');
const PredictiveAnalysisController = require('../../controllers/PredictiveAnalysisController');
const HistoricalDataRepository = require('../../repositories/HistoricalDataRepository');
const authMiddleware = require('../middlewares/authMiddleware');
const PredictiveController = require('../../controllers/PredictiveController.js');

const router = express.Router();
const repository = new HistoricalDataRepository();
const controller = new PredictiveAnalysisController(repository);
const predictiveController = new PredictiveController();

// Aplicando middleware de autenticação a todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/predictive/volume:
 *   get:
 *     summary: Obtém previsão de volume para um produto
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         required: true
 *         description: Data para previsão (formato YYYY-MM-DD)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Análise de volume bem-sucedida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     historical:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-03-15"
 *                           volume:
 *                             type: number
 *                             example: 150
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-04-15"
 *                           predictedVolume:
 *                             type: number
 *                             example: 165
 *                           confidence:
 *                             type: number
 *                             example: 0.85
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         trend:
 *                           type: number
 *                           example: 0.15
 *                         calculatedAt:
 *                           type: string
 *                           example: "2025-03-15T10:30:00Z"
 *                         dataQuality:
 *                           type: string
 *                           example: "high"
 *                         isAggregate:
 *                           type: boolean
 *                           example: false
 *             example:
 *               success: true
 *               data:
 *                 historical:
 *                   - date: "2025-03-15"
 *                     volume: 150
 *                 predictions:
 *                   - date: "2025-04-15"
 *                     predictedVolume: 165
 *                     confidence: 0.85
 *                 metadata:
 *                   trend: 0.15
 *                   calculatedAt: "2025-03-15T10:30:00Z"
 *                   dataQuality: "high"
 *                   isAggregate: false
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Parâmetros inválidos"
 *               details: "É necessário fornecer a data e o ID do produto"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Erro interno do servidor"
 */
router.get('/volume', controller.getPredictedVolume.bind(controller));

/**
 * @swagger
 * /api/predictive/anomalies:
 *   get:
 *     summary: Detecta anomalias nos dados históricos
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data inicial para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data final para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [ALTA, MÉDIA, BAIXA]
 *         required: false
 *         description: Filtro de severidade das anomalias
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Número máximo de anomalias a retornar
 *     responses:
 *       200:
 *         description: Anomalias detectadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     anomalies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-03-20"
 *                           expectedValue:
 *                             type: number
 *                             example: 160
 *                           actualValue:
 *                             type: number
 *                             example: 250
 *                           deviation:
 *                             type: number
 *                             example: 0.56
 *                           severity:
 *                             type: string
 *                             enum: [ALTA, MÉDIA, BAIXA]
 *                             example: "ALTA"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         detectionThreshold:
 *                           type: number
 *                           example: 0.30
 *                         analyzedPeriod:
 *                           type: string
 *                           example: "2025-01-01 a 2025-03-31"
 *                         totalAnomalies:
 *                           type: integer
 *                           example: 3
 *             example:
 *               success: true
 *               data:
 *                 anomalies:
 *                   - date: "2025-03-20"
 *                     expectedValue: 160
 *                     actualValue: 250
 *                     deviation: 0.56
 *                     severity: "ALTA"
 *                   - date: "2025-02-15"
 *                     expectedValue: 145
 *                     actualValue: 95
 *                     deviation: 0.35
 *                     severity: "MÉDIA"
 *                 metadata:
 *                   detectionThreshold: 0.30
 *                   analyzedPeriod: "2025-01-01 a 2025-03-31"
 *                   totalAnomalies: 3
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Parâmetros inválidos"
 *               details: "É necessário fornecer o ID do produto"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Erro interno do servidor"
 */
router.get('/anomalies', controller.detectAnomalies.bind(controller));

/**
 * @swagger
 * /api/predictive/recommendations:
 *   get:
 *     summary: Recomendações baseadas em dados históricos
 *     tags: [Predictive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto ou ALL para todos
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data de referência (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Número máximo de recomendações
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Categoria específica para filtrar recomendações
 *     responses:
 *       200:
 *         description: Recomendações geradas com sucesso
 *       500:
 *         description: Erro interno
 */
router.get('/recommendations', predictiveController.getRecommendations.bind(predictiveController));

/**
 * @swagger
 * /api/predictive/metrics:
 *   get:
 *     summary: Obtém métricas detalhadas para um produto
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data inicial para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data final para análise (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         averageVolume:
 *                           type: number
 *                           example: 145.8
 *                         volatility:
 *                           type: number
 *                           example: 0.21
 *                         growthRate:
 *                           type: number
 *                           example: 0.12
 *                         seasonalityIndex:
 *                           type: number
 *                           example: 1.34
 *                         forecastAccuracy:
 *                           type: number
 *                           example: 0.92
 *                         anomalyRate:
 *                           type: number
 *                           example: 0.05
 *                     timeSeriesAnalysis:
 *                       type: object
 *                       properties:
 *                         trend:
 *                           type: string
 *                           example: "UPWARD"
 *                         seasonality:
 *                           type: string
 *                           example: "STRONG"
 *                         cyclicality:
 *                           type: string
 *                           example: "MODERATE"
 *                         noiseLevel:
 *                           type: string
 *                           example: "LOW"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         analyzedPeriod:
 *                           type: string
 *                           example: "2025-01-01 a 2025-03-31"
 *                         dataPoints:
 *                           type: integer
 *                           example: 90
 *                         calculatedAt:
 *                           type: string
 *                           example: "2025-04-01T08:15:22Z"
 *                         modelVersion:
 *                           type: string
 *                           example: "1.2.5"
 *             example:
 *               success: true
 *               data:
 *                 metrics:
 *                   averageVolume: 145.8
 *                   volatility: 0.21
 *                   growthRate: 0.12
 *                   seasonalityIndex: 1.34
 *                   forecastAccuracy: 0.92
 *                   anomalyRate: 0.05
 *                 timeSeriesAnalysis:
 *                   trend: "UPWARD"
 *                   seasonality: "STRONG"
 *                   cyclicality: "MODERATE"
 *                   noiseLevel: "LOW"
 *                 metadata:
 *                   analyzedPeriod: "2025-01-01 a 2025-03-31"
 *                   dataPoints: 90
 *                   calculatedAt: "2025-04-01T08:15:22Z"
 *                   modelVersion: "1.2.5"
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Parâmetros inválidos"
 *               details: "É necessário fornecer o ID do produto"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Erro interno do servidor"
 */
router.get('/metrics', controller.getDetailedMetrics.bind(controller));

/**
 * @swagger
 * /api/predictive/export/{type}:
 *   get:
 *     summary: Exporta dados de análise em formato CSV
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [anomalies, recommendations, metrics]
 *         required: true
 *         description: Tipo de dados para exportação
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data inicial para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: false
 *         description: Data final para análise (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Arquivo CSV com os dados exportados
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Nenhum dado encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/export/:type', controller.exportData.bind(controller));

/**
 * @swagger
 * /api/predictive/history:
 *   get:
 *     summary: Obtém histórico de previsões para um produto
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Data inicial para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Data final para análise (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Histórico de previsões obtido com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/history', controller.getPredictionHistory.bind(controller));

/**
 * @swagger
 * /api/predictive/notifications/{notificationId}/read:
 *   put:
 *     summary: Marca uma notificação como lida
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida com sucesso
 *       400:
 *         description: ID da notificação inválido
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/notifications/:notificationId/read', controller.markNotificationAsRead.bind(controller));

/**
 * @swagger
 * /api/predictive/volume-analysis:
 *   get:
 *     summary: Obtém análise completa de volume com histórico e previsões
 *     tags: [Análise Preditiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto (use 'ALL' para agregado de todos os produtos)
 *       - in: query
 *         name: targetDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Data alvo para análise (formato YYYY-MM-DD)
 *       - in: query
 *         name: monthsBack
 *         schema:
 *           type: integer
 *         required: false
 *         default: 3
 *         description: Número de meses de histórico para análise
 *       - in: query
 *         name: monthsForward
 *         schema:
 *           type: integer
 *         required: false
 *         default: 2
 *         description: Número de dias para previsão futura (anteriormente era meses, agora representa dias)
 *     responses:
 *       200:
 *         description: Análise de volume obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     historical:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2025-03-15"
 *                           volume:
 *                             type: number
 *                             example: 150
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2025-04-15"
 *                           predictedVolume:
 *                             type: number
 *                             example: 165
 *                           confidence:
 *                             type: number
 *                             example: 0.85
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         trend:
 *                           type: number
 *                           example: 0.15
 *                         calculatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-15T10:30:00Z"
 *                         dataQuality:
 *                           type: string
 *                           enum: [high, low]
 *                           example: "high"
 *                         isAggregate:
 *                           type: boolean
 *                           example: false
 *                         daysForward:
 *                           type: integer
 *                           example: 2
 *                           description: Número de dias para os quais foram geradas previsões
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/volume-analysis', controller.getVolumeAnalysis.bind(controller));

/**
 * @swagger
 * /api/predictive/scenarios:
 *   get:
 *     summary: Retorna cenários preditivos para um produto
 *     tags: [Predictive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto ou ALL para todos
 *       - in: query
 *         name: baseDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data base para a análise (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Cenários gerados com sucesso
 *       500:
 *         description: Erro interno
 */
router.get('/scenarios', predictiveController.getScenarios.bind(predictiveController));

/**
 * @swagger
 * /api/predictive/seasonality:
 *   get:
 *     summary: Análise de sazonalidade para um produto
 *     tags: [Predictive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto ou ALL para todos
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Análise de sazonalidade realizada com sucesso
 *       500:
 *         description: Erro interno
 */
router.get('/seasonality', predictiveController.getSeasonality.bind(predictiveController));

/**
 * @swagger
 * /api/predictive/influence-factors:
 *   get:
 *     summary: Fatores de influência para um produto
 *     tags: [Predictive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto ou ALL para todos
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Fatores de influência analisados com sucesso
 *       500:
 *         description: Erro interno
 */
router.get('/influence-factors', predictiveController.getInfluenceFactors.bind(predictiveController));

/**
 * @swagger
 * /api/predictive/period-comparison:
 *   get:
 *     summary: Comparação entre períodos
 *     tags: [Predictive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto ou ALL para todos
 *       - in: query
 *         name: currentPeriodStart
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data inicial do período atual (YYYY-MM-DD)
 *       - in: query
 *         name: currentPeriodEnd
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data final do período atual (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Comparação realizada com sucesso
 *       500:
 *         description: Erro interno
 */
router.get('/period-comparison', predictiveController.getPeriodComparison.bind(predictiveController));

module.exports = router; 