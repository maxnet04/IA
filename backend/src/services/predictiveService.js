const HistoricalDataRepository = require('../repositories/HistoricalDataRepository');
const logger = require('../utils/logger');

/**
 * Serviço para análises preditivas e processamento de dados históricos
 */
class PredictiveService {
    constructor() {
        this.repository = new HistoricalDataRepository();
    }

    /**
     * Calcula o volume previsto para uma data específica
     * @param {string} productId ID do produto
     * @param {string} targetDate Data alvo
     * @returns {Promise<Object>} Previsão calculada
     */
    async calculatePredictedVolume(productId, targetDate) {
        // Busca dados históricos para análise
        const historicalData = await this.repository.getHistoricalData(productId, null, targetDate);

        if (historicalData.length < 3) {
            logger.warn(`Dados históricos insuficientes para previsão do produto ${productId}`);
            throw new Error('Dados históricos insuficientes para previsão');
        }

        // Calcula média móvel e tendência
        const movingAverage = this.calculateMovingAverage(historicalData);
        const trend = this.analyzeTrend(historicalData);
        
        // Aplica modelo de previsão
        const prediction = this.applyPredictionModel(historicalData, movingAverage, trend);

        return {
            volume: Math.round(prediction.volume),
            confidence: prediction.confidence,
            trend: trend
        };
    }

    /**
     * Calcula média móvel dos últimos períodos
     * @param {Array} data Dados históricos
     * @returns {number} Média móvel
     */
    calculateMovingAverage(data) {
        const periods = Math.min(3, data.length);
        const sum = data
            .slice(0, periods)
            .reduce((acc, curr) => acc + curr.volume, 0);
        
        return sum / periods;
    }

    /**
     * Analisa tendência dos dados
     * @param {Array} data Dados para análise
     * @returns {number} Tendência calculada
     */
    analyzeTrend(data) {
        if (data.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < data.length; i++) {
            const change = (data[i-1].volume - data[i].volume) / data[i].volume;
            changes.push(change);
        }

        return changes.reduce((acc, curr) => acc + curr, 0) / changes.length;
    }

    /**
     * Aplica modelo de previsão
     * @param {Array} historicalData Dados históricos
     * @param {number} movingAverage Média móvel
     * @param {number} trend Tendência
     * @returns {Object} Previsão calculada
     */
    applyPredictionModel(historicalData, movingAverage, trend) {
        // Aplica um modelo simples baseado em média móvel e tendência
        const baseVolume = movingAverage * (1 + trend);
        
        // Ajusta com sazonalidade se houver dados suficientes
        let seasonalFactor = 1;
        if (historicalData.length >= 12) {
            const monthIndex = new Date(historicalData[0].date).getMonth();
            seasonalFactor = this.calculateSeasonalFactor(historicalData, monthIndex);
        }

        // Calcula confiança baseada na quantidade e qualidade dos dados
        const confidence = this.calculateConfidence(historicalData);

        return {
            volume: baseVolume * seasonalFactor,
            confidence: confidence
        };
    }

    /**
     * Calcula fator sazonal
     * @param {Array} data Dados históricos
     * @param {number} monthIndex Índice do mês (0-11)
     * @returns {number} Fator sazonal
     */
    calculateSeasonalFactor(data, monthIndex) {
        const monthlyData = data.filter(d => new Date(d.date).getMonth() === monthIndex);
        if (monthlyData.length === 0) return 1;

        const monthlyAvg = monthlyData.reduce((acc, curr) => acc + curr.volume, 0) / monthlyData.length;
        const totalAvg = data.reduce((acc, curr) => acc + curr.volume, 0) / data.length;

        return monthlyAvg / totalAvg;
    }

    /**
     * Calcula nível de confiança da previsão
     * @param {Array} data Dados históricos
     * @returns {number} Percentual de confiança
     */
    calculateConfidence(data) {
        // Base: 60% de confiança
        let confidence = 60;

        // Aumenta confiança baseado na quantidade de dados
        confidence += Math.min(20, data.length * 2);

        // Ajusta baseado na variabilidade dos dados
        const variability = this.calculateVariability(data);
        confidence -= variability * 10;

        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * Calcula variabilidade dos dados
     * @param {Array} data Dados históricos
     * @returns {number} Índice de variabilidade
     */
    calculateVariability(data) {
        if (data.length < 2) return 0;

        const volumes = data.map(d => d.volume);
        const mean = volumes.reduce((acc, curr) => acc + curr, 0) / volumes.length;
        
        const variance = volumes.reduce((acc, curr) => {
            const diff = curr - mean;
            return acc + (diff * diff);
        }, 0) / volumes.length;

        return Math.sqrt(variance) / mean; // Coeficiente de variação
    }
}

module.exports = new PredictiveService(); 