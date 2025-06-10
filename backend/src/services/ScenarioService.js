const { HistoricalDataRepository } = require('../infrastructure/database/HistoricalDataRepository');
const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');

class ScenarioService {
  constructor() {
    this.historicalDataRepo = new HistoricalDataRepository();
    this.incidentRepo = new IncidentRepository();
  }

  async generateScenarios(productId, baseDate, options = {}) {
    try {
      const {
        monthsBack = 3,
        monthsForward = 2,
        optimisticFactor = 15,
        pessimisticFactor = 10,
        riskLevel = 'medium'
      } = options;

      // Buscar dados históricos
      const historicalData = await this.getHistoricalData(productId, monthsBack, baseDate);
      
      // Gerar previsão base
      const baseScenario = await this.predictFutureData(historicalData, monthsForward);
      
      // Calcular intervalos de confiança
      const scenarioWithConfidence = this.calculateConfidenceIntervals(baseScenario, riskLevel);
      
      // Gerar cenários otimista e pessimista
      const scenarios = this.applyScenarioFactors(scenarioWithConfidence, {
        optimistic: optimisticFactor,
        pessimistic: pessimisticFactor
      });

      return {
        success: true,
        data: scenarios
      };
    } catch (error) {
      console.error('Erro ao gerar cenários:', error);
      throw new Error('Falha ao gerar cenários preditivos');
    }
  }

  async getHistoricalData(productId, monthsBack, baseDate) {
    const startDate = new Date(baseDate);
    startDate.setMonth(startDate.getMonth() - monthsBack);

    return await this.incidentRepo.getIncidentsByDateRange(
      productId,
      startDate.toISOString(),
      baseDate
    );
  }

  async predictFutureData(historicalData, months, modelType = 'ARIMA') {
    // Implementação básica inicial - será expandida com modelos mais sofisticados
    const predictions = [];
    const baseDate = new Date();
    const avgVolume = this.calculateAverageVolume(historicalData);
    
    for (let i = 0; i < months * 30; i++) {
      const predictionDate = new Date(baseDate);
      predictionDate.setDate(predictionDate.getDate() + i);
      
      predictions.push({
        date: predictionDate.toISOString(),
        predictedVolume: this.adjustVolumeForSeasonality(avgVolume, predictionDate),
        confidence: 0.85
      });
    }

    return predictions;
  }

  calculateConfidenceIntervals(data, riskLevel) {
    const confidenceFactors = {
      low: 0.1,
      medium: 0.15,
      high: 0.2
    };

    const factor = confidenceFactors[riskLevel] || confidenceFactors.medium;

    return data.map(point => ({
      ...point,
      confidenceUpper: Math.round(point.predictedVolume * (1 + factor)),
      confidenceLower: Math.round(point.predictedVolume * (1 - factor))
    }));
  }

  applyScenarioFactors(baseScenario, factors) {
    const optimisticScenario = baseScenario.map(point => ({
      ...point,
      predictedVolume: Math.round(point.predictedVolume * (1 + factors.optimistic / 100))
    }));

    const pessimisticScenario = baseScenario.map(point => ({
      ...point,
      predictedVolume: Math.round(point.predictedVolume * (1 - factors.pessimistic / 100))
    }));

    return {
      baseScenario,
      optimisticScenario,
      pessimisticScenario,
      metadata: {
        baselineMetrics: this.calculateBaselineMetrics(baseScenario),
        optimisticImpact: factors.optimistic,
        pessimisticImpact: -factors.pessimistic,
        riskAssessment: this.assessRisk(baseScenario)
      }
    };
  }

  calculateAverageVolume(historicalData) {
    if (!historicalData.length) return 0;
    return Math.round(
      historicalData.reduce((sum, data) => sum + data.volume, 0) / historicalData.length
    );
  }

  adjustVolumeForSeasonality(baseVolume, date) {
    const dayOfWeek = date.getDay();
    const monthOfYear = date.getMonth();

    // Ajustes básicos de sazonalidade
    let adjustment = 1.0;

    // Redução nos fins de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      adjustment *= 0.7;
    }

    // Ajustes mensais
    const monthlyFactors = {
      0: 0.8,  // Janeiro
      11: 0.8, // Dezembro
      3: 1.2,  // Abril
      8: 1.2   // Setembro
    };

    adjustment *= monthlyFactors[monthOfYear] || 1.0;

    return Math.round(baseVolume * adjustment);
  }

  calculateBaselineMetrics(baseScenario) {
    const totalVolume = baseScenario.reduce((sum, point) => sum + point.predictedVolume, 0);
    const avgDailyVolume = Math.round(totalVolume / baseScenario.length);

    return {
      totalVolume,
      avgDailyVolume
    };
  }

  assessRisk(baseScenario) {
    // Implementação básica de avaliação de risco
    const volatility = this.calculateVolatility(baseScenario);
    
    if (volatility > 0.2) return 'HIGH';
    if (volatility > 0.1) return 'MEDIUM';
    return 'LOW';
  }

  calculateVolatility(baseScenario) {
    const volumes = baseScenario.map(point => point.predictedVolume);
    const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const squaredDiffs = volumes.map(vol => Math.pow(vol - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / volumes.length;
    return Math.sqrt(variance) / mean;
  }
}

module.exports = ScenarioService; 