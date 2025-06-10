const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const logger = require('../../utils/logger');

module.exports = (incidentController) => {
    logger.info('[ROUTES] Configurando rotas de incidentes');
    
    /**
     * @swagger
     * /api/incidents:
     *   get:
     *     summary: Busca incidentes por período e filtros opcionais
     *     tags: [Incidentes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
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
     *       - in: query
     *         name: grupo
     *         schema:
     *           type: string
     *         description: Filtro por grupo (opcional)
     *       - in: query
     *         name: acao
     *         schema:
     *           type: string
     *           enum: [CANCELADO, RESOLVIDO, DIRECIONADO]
     *         description: Filtro por ação (opcional)
     *     responses:
     *       200:
     *         description: Lista de incidentes
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       codigo:
     *                         type: string
     *                         example: "INC-2025-001"
     *                       descricao:
     *                         type: string
     *                         example: "Falha no sistema de pagamento"
     *                       data:
     *                         type: string
     *                         format: date
     *                         example: "2025-03-15"
     *                       grupo:
     *                         type: string
     *                         example: "FINANCEIRO"
     *                       severidade:
     *                         type: string
     *                         enum: [BAIXA, MEDIA, ALTA, CRITICA]
     *                         example: "ALTA"
     *                       status:
     *                         type: string
     *                         enum: [ABERTO, EM_ANDAMENTO, RESOLVIDO, CANCELADO]
     *                         example: "RESOLVIDO"
     *                       tempoResolucao:
     *                         type: integer
     *                         example: 180
     *                       acao:
     *                         type: string
     *                         enum: [CANCELADO, RESOLVIDO, DIRECIONADO]
     *                         example: "RESOLVIDO"
     *                 message:
     *                   type: string
     *                   example: "Incidentes encontrados com sucesso"
     *             example:
     *               error: false
     *               data:
     *                 - id: 1
     *                   codigo: "INC-2025-001"
     *                   descricao: "Falha no sistema de pagamento"
     *                   data: "2025-03-15"
     *                   grupo: "FINANCEIRO"
     *                   severidade: "ALTA"
     *                   status: "RESOLVIDO"
     *                   tempoResolucao: 180
     *                   acao: "RESOLVIDO"
     *                 - id: 2
     *                   codigo: "INC-2025-002"
     *                   descricao: "Lentidão no sistema de autenticação"
     *                   data: "2025-03-18"
     *                   grupo: "INFRAESTRUTURA"
     *                   severidade: "MEDIA"
     *                   status: "EM_ANDAMENTO"
     *                   tempoResolucao: null
     *                   acao: "DIRECIONADO"
     *               message: "Incidentes encontrados com sucesso"
     *       400:
     *         description: Parâmetros inválidos
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Parâmetros inválidos"
     *               details: "É necessário fornecer as datas inicial e final"
     *       401:
     *         description: Não autorizado
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Token inválido ou expirado"
     *       500:
     *         description: Erro interno do servidor
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Erro interno do servidor"
     */
    router.get('/',
        authMiddleware,
        (req, res, next) => {
            logger.debug(`[ROUTES] Recebida requisição GET /incidents`, {
                query: req.query,
                user: req.user?.id
            });
            incidentController.getIncidents(req, res);
        }
    );
    
    /**
     * @swagger
     * /api/incidents/analysis/timeline:
     *   get:
     *     summary: Obtém dados para análise temporal de incidentes
     *     tags: [Incidentes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Data inicial para análise (YYYY-MM-DD)
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Data final para análise (YYYY-MM-DD)
     *       - in: query
     *         name: period
     *         schema:
     *           type: string
     *           enum: [7d, 15d, 30d, 90d]
     *         description: Período de análise (usado apenas se startDate e endDate não forem fornecidos)
     *       - in: query
     *         name: group
     *         schema:
     *           type: string
     *         description: Grupo para filtrar os incidentes
     *     responses:
     *       200:
     *         description: Dados de análise temporal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                 data:
     *                   type: object
     *                   properties:
     *                     daily:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           date:
     *                             type: string
     *                             format: date
     *                             example: "2025-03-15"
     *                           total:
     *                             type: integer
     *                             example: 12
     *                           resolvidos:
     *                             type: integer
     *                             example: 8
     *                           cancelados:
     *                             type: integer
     *                             example: 1
     *                           pendentes:
     *                             type: integer
     *                             example: 3
     *                     weekly:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           week:
     *                             type: string
     *                             example: "2025-W11"
     *                           total:
     *                             type: integer
     *                             example: 45
     *                     monthly:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           month:
     *                             type: string
     *                             example: "2025-03"
     *                           total:
     *                             type: integer
     *                             example: 180
     *                     metadata:
     *                       type: object
     *                       properties:
     *                         period:
     *                           type: string
     *                           example: "2025-01-01 a 2025-03-31"
     *                         totalDays:
     *                           type: integer
     *                           example: 90
     *                         dailyAverage:
     *                           type: number
     *                           example: 15.2
     *             example:
     *               error: false
     *               data:
     *                 daily:
     *                   - date: "2025-03-15"
     *                     total: 12
     *                     resolvidos: 8
     *                     cancelados: 1
     *                     pendentes: 3
     *                   - date: "2025-03-16"
     *                     total: 10
     *                     resolvidos: 7
     *                     cancelados: 0
     *                     pendentes: 3
     *                 weekly:
     *                   - week: "2025-W11"
     *                     total: 45
     *                   - week: "2025-W12"
     *                     total: 38
     *                 monthly:
     *                   - month: "2025-03"
     *                     total: 180
     *                   - month: "2025-02"
     *                     total: 165
     *                 metadata:
     *                   period: "2025-01-01 a 2025-03-31"
     *                   totalDays: 90
     *                   dailyAverage: 15.2
     *       401:
     *         description: Não autorizado
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Token inválido ou expirado"
     */
    router.get('/analysis/timeline', 
        authMiddleware, 
        (req, res, next) => {
            logger.debug(`[ROUTES] Recebida requisição GET /incidents/analysis/timeline`, {
                query: req.query,
                user: req.user?.id
            });
            incidentController.getTimelineAnalysis(req, res);
        }
    );

    /**
     * @swagger
     * /api/incidents/statistics:
     *   get:
     *     summary: Obtém estatísticas gerais de incidentes
     *     tags: [Incidentes]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Estatísticas gerais
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                 data:
     *                   type: object
     *                   properties:
     *                     total:
     *                       type: integer
     *                       example: 1250
     *                     resolvidos:
     *                       type: integer
     *                       example: 980
     *                     cancelados:
     *                       type: integer
     *                       example: 120
     *                     pendentes:
     *                       type: integer
     *                       example: 150
     *                     tempoMedioResolucao:
     *                       type: number
     *                       example: 142.5
     *                     porGrupo:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           grupo:
     *                             type: string
     *                             example: "FINANCEIRO"
     *                           total:
     *                             type: integer
     *                             example: 350
     *                           percentual:
     *                             type: number
     *                             example: 28.0
     *                     porSeveridade:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           severidade:
     *                             type: string
     *                             example: "ALTA"
     *                           total:
     *                             type: integer
     *                             example: 280
     *                           percentual:
     *                             type: number
     *                             example: 22.4
     *             example:
     *               error: false
     *               data:
     *                 total: 1250
     *                 resolvidos: 980
     *                 cancelados: 120
     *                 pendentes: 150
     *                 tempoMedioResolucao: 142.5
     *                 porGrupo:
     *                   - grupo: "FINANCEIRO"
     *                     total: 350
     *                     percentual: 28.0
     *                   - grupo: "INFRAESTRUTURA"
     *                     total: 300
     *                     percentual: 24.0
     *                   - grupo: "APLICACOES"
     *                     total: 290
     *                     percentual: 23.2
     *                 porSeveridade:
     *                   - severidade: "ALTA"
     *                     total: 280
     *                     percentual: 22.4
     *                   - severidade: "MEDIA"
     *                     total: 510
     *                     percentual: 40.8
     *                   - severidade: "BAIXA"
     *                     total: 460
     *                     percentual: 36.8
     *       401:
     *         description: Não autorizado
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Token inválido ou expirado"
     */
    router.get('/statistics', 
        authMiddleware, 
        (req, res, next) => {
            logger.debug(`[ROUTES] Recebida requisição GET /incidents/statistics`, {
                user: req.user?.id
            });
            incidentController.getStatistics(req, res);
        }
    );
    
    logger.info('[ROUTES] Rotas de incidentes configuradas com sucesso');
    
    return router;
}; 