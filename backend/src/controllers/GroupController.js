const PredictiveAnalysisService = require('../services/PredictiveAnalysisService');
const GroupRepository = require('../repositories/GroupRepository');
const logger = require('../utils/logger');

/**
 * Controller para operações relacionadas a grupos
 */
class GroupController {
    constructor() {
        this.predictiveAnalysisService = new PredictiveAnalysisService();
        this.groupRepository = new GroupRepository();
        
        logger.info('[CONTROLLER] Inicializando GroupController');
    }

    /**
     * Obtém lista de todos os grupos disponíveis
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAllGroups(req, res) {
        try {
            logger.info('[CONTROLLER] Buscando todos os grupos');
            
            const groups = await this.groupRepository.getAllGroups();
            
            logger.info(`[CONTROLLER] ${groups.length} grupos encontrados`);
            
            res.json({
                success: true,
                data: groups,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('[CONTROLLER] Erro ao buscar grupos:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao buscar grupos',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém detalhes de um grupo específico
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupDetails(req, res) {
        try {
            const { groupId } = req.params;
            
            logger.info(`[CONTROLLER] Buscando detalhes do grupo: ${groupId}`);
            
            const groupDetails = await this.groupRepository.getGroupDetails(groupId);
            
            if (!groupDetails) {
                return res.status(404).json({
                    success: false,
                    error: 'Grupo não encontrado',
                    timestamp: new Date().toISOString()
                });
            }
            
            logger.info(`[CONTROLLER] Detalhes do grupo ${groupId} obtidos com sucesso`);
            
            res.json({
                success: true,
                data: groupDetails,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao buscar detalhes do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao buscar detalhes do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém dados históricos de um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupHistoricalData(req, res) {
        try {
            const { groupId } = req.params;
            const { startDate, endDate } = req.query;
            
            logger.info(`[CONTROLLER] Buscando dados históricos do grupo: ${groupId}, período: ${startDate} - ${endDate}`);
            
            const historicalData = await this.groupRepository.getHistoricalData(groupId, startDate, endDate);
            
            logger.info(`[CONTROLLER] ${historicalData.length} registros históricos encontrados para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: historicalData,
                groupId: groupId,
                period: { startDate, endDate },
                count: historicalData.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao buscar dados históricos do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao buscar dados históricos do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Gera previsões para um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async predictGroupVolume(req, res) {
        try {
            const { groupId } = req.params;
            const { date, daysForward } = req.query;
            
            const targetDate = date || new Date().toISOString().split('T')[0];
            const days = parseInt(daysForward) || 7;
            
            logger.info(`[CONTROLLER] Gerando previsões para o grupo: ${groupId}, data: ${targetDate}, dias: ${days}`);
            
            let predictions;
            if (days === 1) {
                predictions = [await this.predictiveAnalysisService.predictVolumeByGroup(targetDate, groupId)];
            } else {
                predictions = await this.predictiveAnalysisService.getGroupPredictions(groupId, targetDate, days);
            }
            
            logger.info(`[CONTROLLER] ${predictions.length} previsões geradas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: predictions,
                groupId: groupId,
                targetDate: targetDate,
                daysForward: days,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao gerar previsões para o grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao gerar previsões para o grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Detecta anomalias em um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async detectGroupAnomalies(req, res) {
        try {
            const { groupId } = req.params;
            const { startDate, endDate, severity, limit } = req.query;
            
            logger.info(`[CONTROLLER] Detectando anomalias para o grupo: ${groupId}, período: ${startDate} - ${endDate}`);
            
            const anomalies = await this.predictiveAnalysisService.detectGroupAnomalies(
                groupId, 
                startDate, 
                endDate, 
                severity, 
                limit
            );
            
            logger.info(`[CONTROLLER] ${anomalies.anomalies.length} anomalias detectadas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: anomalies,
                groupId: groupId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao detectar anomalias para o grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao detectar anomalias do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Gera recomendações para um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async generateGroupRecommendations(req, res) {
        try {
            const { groupId } = req.params;
            
            logger.info(`[CONTROLLER] Gerando recomendações para o grupo: ${groupId}`);
            
            const recommendations = await this.predictiveAnalysisService.generateGroupRecommendations(groupId);
            
            logger.info(`[CONTROLLER] ${recommendations.recommendations.length} recomendações geradas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: recommendations,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao gerar recomendações para o grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao gerar recomendações para o grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém métricas de um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupMetrics(req, res) {
        try {
            const { groupId } = req.params;
            const { startDate, endDate } = req.query;
            
            logger.info(`[CONTROLLER] Obtendo métricas do grupo: ${groupId}, período: ${startDate} - ${endDate}`);
            
            const metrics = await this.predictiveAnalysisService.getGroupMetrics(groupId, startDate, endDate);
            
            logger.info(`[CONTROLLER] Métricas obtidas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao obter métricas do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao obter métricas do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém histórico de volume de um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupVolumeHistory(req, res) {
        try {
            const { groupId } = req.params;
            const { targetDate, monthsBack } = req.query;
            
            const date = targetDate || new Date().toISOString().split('T')[0];
            const months = parseInt(monthsBack) || 3;
            
            logger.info(`[CONTROLLER] Obtendo histórico de volume do grupo: ${groupId}, data: ${date}, meses: ${months}`);
            
            const volumeHistory = await this.predictiveAnalysisService.getGroupVolumeHistory(groupId, date, months);
            
            logger.info(`[CONTROLLER] ${volumeHistory.length} registros de histórico de volume obtidos para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: volumeHistory,
                groupId: groupId,
                targetDate: date,
                monthsBack: months,
                count: volumeHistory.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao obter histórico de volume do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao obter histórico de volume do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém métricas agregadas de um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupAggregatedMetrics(req, res) {
        try {
            const { groupId } = req.params;
            const { startDate, endDate } = req.query;
            
            logger.info(`[CONTROLLER] Obtendo métricas agregadas do grupo: ${groupId}, período: ${startDate} - ${endDate}`);
            
            const aggregatedMetrics = await this.groupRepository.getAggregatedMetrics(groupId, startDate, endDate);
            
            logger.info(`[CONTROLLER] Métricas agregadas obtidas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: aggregatedMetrics,
                groupId: groupId,
                period: { startDate, endDate },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao obter métricas agregadas do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao obter métricas agregadas do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Obtém dados por categoria para um grupo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGroupDataByCategory(req, res) {
        try {
            const { groupId } = req.params;
            const { startDate, endDate } = req.query;
            
            logger.info(`[CONTROLLER] Obtendo dados por categoria do grupo: ${groupId}, período: ${startDate} - ${endDate}`);
            
            const categoryData = await this.groupRepository.getDataByCategory(groupId, startDate, endDate);
            
            logger.info(`[CONTROLLER] ${categoryData.length} categorias encontradas para o grupo ${groupId}`);
            
            res.json({
                success: true,
                data: categoryData,
                groupId: groupId,
                period: { startDate, endDate },
                count: categoryData.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao obter dados por categoria do grupo ${req.params.groupId}:`, error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao obter dados por categoria do grupo',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new GroupController(); 