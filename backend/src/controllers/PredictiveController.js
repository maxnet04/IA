console.log('=== PredictiveController CARREGADO ===', __filename);
const HistoricalDataRepository = require('../repositories/HistoricalDataRepository');
const predictiveService = require('../services/predictiveService');
const logger = require('../utils/logger');
const ScenarioService = require('../services/ScenarioService');
const SeasonalityService = require('../services/SeasonalityService');
const InfluenceFactorsService = require('../services/InfluenceFactorsService');
const ComparisonService = require('../services/ComparisonService');
const RecommendationService = require('../services/RecommendationService');
const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');

/**
 * Controlador para operações preditivas
 */
class PredictiveController {
    constructor() {
        this.repository = new HistoricalDataRepository();
        this.scenarioService = new ScenarioService();
        this.seasonalityService = new SeasonalityService();
        this.influenceFactorsService = new InfluenceFactorsService();
        this.comparisonService = new ComparisonService();
        this.recommendationService = new RecommendationService();
        this.incidentRepository = new IncidentRepository();
    }

    /**
     * Análise completa de volume com histórico e previsões
     * @param {Object} req Request
     * @param {Object} res Response
     */
    async getVolumeAnalysis(req, res) {
        try {
            const { productId, targetDate, monthsBack = 3, daysForward = 2 } = req.query;

            if (!productId || !targetDate) {
                return res.status(400).json({
                    success: false,
                    error: 'ProductId e targetDate são obrigatórios'
                });
            }

            let historicalData;
            
            if (productId === 'ALL') {
                // Para ALL, busca o volume agregado de todos os produtos
                historicalData = await this.repository.getAggregatedVolumeHistory(targetDate, monthsBack);
            } else {
                // Para produtos específicos
                historicalData = await this.repository.getVolumeHistory(productId, targetDate, monthsBack);
            }

            // Formata dados históricos no formato simplificado
            const formattedHistorical = historicalData.map(h => ({
                date: h.date.split('T')[0], // Garante formato YYYY-MM-DD
                volume: Number(h.volume)
            }));

            // Calcula previsões para os próximos dias
            const predictions = [];
            let currentDate = new Date(targetDate);
            
            for (let i = 0; i < daysForward; i++) {
                const predictedData = await predictiveService.calculatePredictedVolume(
                    productId,
                    currentDate.toISOString().split('T')[0]
                );

                predictions.push({
                    date: currentDate.toISOString().split('T')[0],
                    predictedVolume: Number(predictedData.predictedVolume),
                    confidence: Number(predictedData.confidence) / 100 // Convertendo para decimal (0-1)
                });

                // Avança para o próximo dia
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Calcula a tendência com base nos volumes históricos
            const volumes = formattedHistorical.map(h => h.volume);
            const lastIndex = volumes.length - 1;
            const trend = lastIndex > 0 
                ? (volumes[lastIndex] - volumes[0]) / volumes[0]
                : 0;

            return res.json({
                success: true,
                data: {
                    historical: formattedHistorical,
                    predictions: predictions,
                    metadata: {
                        trend: Number(trend.toFixed(2)),
                        calculatedAt: new Date().toISOString(),
                        dataQuality: historicalData.length >= 3 ? 'high' : 'low',
                        isAggregate: productId === 'ALL'
                    }
                }
            });

        } catch (error) {
            logger.error('Erro na análise de volume:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao realizar análise de volume'
            });
        }
    }

    async getScenarios(req, res) {
        try {
            const { productId, baseDate, monthsBack = 3, monthsForward = 2, optimisticFactor = 15, pessimisticFactor = 10, riskLevel = 'medium' } = req.query;

            // Calcula as datas para análise
            const startDate = new Date(baseDate);
            startDate.setMonth(startDate.getMonth() - monthsBack);
            const endDate = new Date(baseDate);
            endDate.setMonth(endDate.getMonth() + monthsForward);

            // Busca dados históricos
            const historicalData = await this.incidentRepository.getConsolidatedIncidents(
                productId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );

            // Gera cenários
            const scenarios = this.generateScenarios(historicalData, {
                optimisticFactor: parseFloat(optimisticFactor),
                pessimisticFactor: parseFloat(pessimisticFactor),
                riskLevel
            });

            res.json(scenarios);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSeasonality(req, res) {
        try {
            const { productId, startDate, endDate, groupBy = 'day_of_week' } = req.query;

            const incidents = await this.incidentRepository.getConsolidatedIncidents(
                productId,
                startDate,
                endDate
            );

            const seasonalityAnalysis = this.analyzeSeasonality(incidents, groupBy);
            res.json(seasonalityAnalysis);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getInfluenceFactors(req, res) {
        try {
            const { groupId, startDate, endDate } = req.query;
            const result = await this.influenceFactorsService.analyzeFactors(groupId, { startDate, endDate });
            res.json(result.data);
        } catch (error) {
            logger.error('[PredictiveController] Erro:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getPeriodComparison(req, res) {
        try {
            const { 
                groupId, 
                currentPeriodStart, 
                currentPeriodEnd, 
                comparisonType = 'year_over_year',
                customPeriodStart,
                customPeriodEnd 
            } = req.query;

            // Busca dados do período atual (sumarizado por mês) para grupo
            const currentPeriod = await this.incidentRepository.getMonthlyConsolidatedIncidentsByGroup(
                groupId,
                currentPeriodStart,
                currentPeriodEnd
            );

            // Define período de comparação
            let comparisonStart, comparisonEnd;
            if (comparisonType === 'year_over_year') {
                comparisonStart = new Date(currentPeriodStart);
                comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
                comparisonEnd = new Date(currentPeriodEnd);
                comparisonEnd.setFullYear(comparisonEnd.getFullYear() - 1);
            } else {
                comparisonStart = new Date(customPeriodStart);
                comparisonEnd = new Date(customPeriodEnd);
            }

            // Busca dados do período de comparação (sumarizado por mês) para grupo
            const previousPeriod = await this.incidentRepository.getMonthlyConsolidatedIncidentsByGroup(
                groupId,
                comparisonStart.toISOString().split('T')[0],
                comparisonEnd.toISOString().split('T')[0]
            );

            const comparison = this.comparePeriods(currentPeriod, previousPeriod);
            res.json(comparison);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getRecommendations(req, res) {
        try {
            const { groupId, date, limit = 3, category = null } = req.query;

            if (!groupId || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'GroupId e date são parâmetros obrigatórios'
                });
            }

            // Usar o serviço de recomendações para análise real baseada em dados
            const result = await this.recommendationService.generateRecommendationsForGroup(
                groupId,
                date,
                parseInt(limit),
                category
            );
            
            // Se a requisição for para todos os grupos, adicionar flag para identificação
            if (groupId === "ALL") {
                result.data.isAggregateRecommendation = true;
            }
            
            // Adicionar metadados úteis na resposta
            result.data.metadata = {
                generatedAt: new Date().toISOString(),
                requestParams: { groupId, date, limit, category }
            };
            
            res.json(result);
        } catch (error) {
            logger.error('[PredictiveController] Erro ao gerar recomendações:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro ao gerar recomendações'
            });
        }
    }

    // Métodos auxiliares privados
    generateScenarios(historicalData, options) {
        const baseScenario = historicalData.map(incident => ({
            date: incident.incident_date,
            predictedVolume: incident.volume,
            confidence: 0.85,
            confidenceUpper: Math.round(incident.volume * (1 + options.optimisticFactor/100)),
            confidenceLower: Math.round(incident.volume * (1 - options.pessimisticFactor/100))
        }));

        const optimisticScenario = historicalData.map(incident => ({
            date: incident.incident_date,
            predictedVolume: Math.round(incident.volume * (1 + options.optimisticFactor/100))
        }));

        const pessimisticScenario = historicalData.map(incident => ({
            date: incident.incident_date,
            predictedVolume: Math.round(incident.volume * (1 - options.pessimisticFactor/100))
        }));

        return {
            baseScenario,
            optimisticScenario,
            pessimisticScenario,
            metadata: {
                baselineMetrics: {
                    totalVolume: historicalData.reduce((sum, incident) => sum + incident.volume, 0),
                    avgDailyVolume: historicalData.reduce((sum, incident) => sum + incident.volume, 0) / historicalData.length
                },
                optimisticImpact: options.optimisticFactor,
                pessimisticImpact: -options.pessimisticFactor,
                riskAssessment: options.riskLevel.toUpperCase()
            }
        };
    }

    analyzeSeasonality(incidents, groupBy) {
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const heatmapData = [];
        
        // Implementação completa do createHeatmapData
        if (groupBy === 'day_of_week') {
            // Agrupa por dia da semana e mês
            const monthlyData = {};
            
            incidents.forEach(incident => {
                const date = new Date(incident.incident_date);
                const month = months[date.getMonth()];
                const dayOfWeek = weekDays[date.getDay()];

                if (!monthlyData[month]) {
                    monthlyData[month] = {};
                    weekDays.forEach(day => monthlyData[month][day] = 0);
                }

                monthlyData[month][dayOfWeek] += incident.volume;
            });

            // Converte para o formato do heatmap
            Object.entries(monthlyData).forEach(([month, days]) => {
                heatmapData.push({
                    month,
                    ...days
                });
            });
        } else if (groupBy === 'month') {
            // Agrupa por mês
            const monthlyVolumes = {};
            
            incidents.forEach(incident => {
                const date = new Date(incident.incident_date);
                const month = months[date.getMonth()];
                
                monthlyVolumes[month] = (monthlyVolumes[month] || 0) + incident.volume;
            });

            months.forEach(month => {
                heatmapData.push({
                    month,
                    volume: monthlyVolumes[month] || 0
                });
            });
        }
        
        // Gerar insights baseados nos dados do heatmap
        const insights = this.generateSeasonalInsights(heatmapData);

        return {
            heatmapData,
            insights
        };
    }
    
    /**
     * Gera insights de sazonalidade com base nos dados do mapa de calor
     * @param {Array} heatmapData Dados do mapa de calor
     * @returns {Object} Insights de sazonalidade
     */
    generateSeasonalInsights(heatmapData) {
        const insights = {
            peakDays: [],
            peakMonths: [],
            lowestPeriods: [],
            seasonalityStrength: 0
        };

        if (heatmapData.length === 0) return insights;

        // Análise de picos por dia da semana
        const dayTotals = {};
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        weekDays.forEach(day => {
            dayTotals[day] = heatmapData.reduce((sum, month) => sum + (month[day] || 0), 0);
        });

        const avgDailyVolume = Object.values(dayTotals).reduce((sum, vol) => sum + vol, 0) / 
            Object.values(dayTotals).length;
        
        // Identifica dias de pico (20% acima da média)
        insights.peakDays = weekDays.filter(day => dayTotals[day] > avgDailyVolume * 1.2);

        // Análise de picos mensais
        const monthlyTotals = heatmapData.map(month => ({
            month: month.month,
            total: weekDays.reduce((sum, day) => sum + (month[day] || 0), 0)
        }));

        const avgMonthlyVolume = monthlyTotals.reduce((sum, month) => sum + month.total, 0) / 
            monthlyTotals.length;

        // Identifica meses de pico (20% acima da média)
        insights.peakMonths = monthlyTotals
            .filter(month => month.total > avgMonthlyVolume * 1.2)
            .map(month => month.month);

        // Identifica períodos mais baixos (30% abaixo da média)
        insights.lowestPeriods = monthlyTotals
            .filter(month => month.total < avgMonthlyVolume * 0.7)
            .map(month => month.month);

        // Calcula força da sazonalidade (variação em relação à média)
        const variations = monthlyTotals.map(month => 
            Math.abs(month.total - avgMonthlyVolume) / avgMonthlyVolume);
        
        insights.seasonalityStrength = Math.round(
            (variations.reduce((sum, var_) => sum + var_, 0) / variations.length) * 100
        ) / 100;

        return insights;
    }

    comparePeriods(currentPeriod, previousPeriod) {
        const currentTotal = currentPeriod.reduce((sum, incident) => sum + incident.volume, 0);
        const previousTotal = previousPeriod.reduce((sum, incident) => sum + incident.volume, 0);
        const overallGrowth = ((currentTotal - previousTotal) / previousTotal) * 100;

        return {
            currentPeriod,
            previousPeriod,
            comparison: {
                overallGrowth,
                highestDifference: {
                    date: currentPeriod[0]?.incident_date,
                    difference: 0 // Deve ser calculado comparando dias específicos
                },
                lowestDifference: {
                    date: currentPeriod[0]?.incident_date,
                    difference: 0 // Deve ser calculado comparando dias específicos
                }
            }
        };
    }
}

module.exports = PredictiveController; 