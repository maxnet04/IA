const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');

class InfluenceFactorsService {
  constructor() {
    this.incidentRepo = new IncidentRepository();
  }

  async analyzeFactors(productId, period) {
    try {
      const incidents = await this.incidentRepo.getIncidentsByDateRange(
        productId,
        period.startDate,
        period.endDate
      );
      const factors = this.identifyFactors(incidents);
      const correlations = this.calculateCorrelations(incidents, factors);
      const rankedFactors = this.rankFactorsByImpact(factors, correlations);
      const result = {
        success: true,
        data: {
          factors: rankedFactors,
          correlationMatrix: correlations
        }
      };
      return result;
    } catch (error) {
      console.error('[InfluenceFactorsService] Erro ao analisar fatores de influência:', error);
      throw new Error('Falha ao analisar fatores de influência');
    }
  }

  identifyFactors(incidents) {
    const factors = [];

    // Análise de Sazonalidade
    const seasonalityFactor = this.analyzeSeasonal(incidents);
    if (seasonalityFactor.impact > 0.005) {
      factors.push(seasonalityFactor);
    }

    // Análise de Tendência
    const trendFactor = this.analyzeTrend(incidents);
    if (trendFactor.impact > 0.005) {
      factors.push(trendFactor);
    }

    // Análise de Anomalias
    const anomalyFactor = this.analyzeAnomalies(incidents);
    if (anomalyFactor.impact > 0.01) {
      factors.push(anomalyFactor);
    }

    // Análise de Grupos (substitui categorias)
    const groupFactors = this.analyzeGroups(incidents);
    factors.push(...groupFactors);

    return factors;
  }

  analyzeSeasonal(incidents) {
    const weekdayVolumes = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);
    
    incidents.forEach(incident => {
      const date = new Date(incident.incident_date);
      const dayOfWeek = date.getDay();
      weekdayVolumes[dayOfWeek] += incident.volume;
      weekdayCounts[dayOfWeek]++;
    });

    const avgVolumes = weekdayVolumes.map((vol, idx) => 
      weekdayCounts[idx] ? vol / weekdayCounts[idx] : 0
    );

    const overallAvg = avgVolumes.reduce((sum, vol) => sum + vol, 0) / avgVolumes.length;
    const maxVariation = Math.max(...avgVolumes.map(vol => Math.abs(vol - overallAvg) / overallAvg));

    return {
      name: 'Sazonalidade',
      impact: maxVariation,
      description: 'Padrões sazonais detectados nos dados históricos'
    };
  }

  analyzeTrend(incidents) {
    if (incidents.length < 2) {
      return { name: 'Tendência', impact: 0, description: 'Dados insuficientes para análise de tendência' };
    }

    // Ordena incidentes por data
    const sortedIncidents = [...incidents].sort((a, b) => 
      new Date(a.incident_date) - new Date(b.incident_date)
    );

    // Calcula a tendência linear
    const n = sortedIncidents.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = sortedIncidents.map(inc => inc.volume);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;

    const impact = Math.abs(slope * n / avgY);

    return {
      name: 'Tendência',
      impact: Math.min(impact, 1),
      description: `Tendência ${slope > 0 ? 'crescente' : 'decrescente'} identificada`
    };
  }

  analyzeAnomalies(incidents) {
    const anomalies = incidents.filter(inc => inc.is_anomaly);
    const impact = anomalies.length / incidents.length;

    return {
      name: 'Anomalias',
      impact,
      description: `${anomalies.length} anomalias detectadas no período`
    };
  }

  analyzeGroups(incidents) {
    const groupVolumes = {};
    const groupFactors = [];

    // Agrupa volumes por grupo direcionado (removido grupo_atual)
    incidents.forEach(incident => {
      const grupo = incident.GRUPO_DIRECIONADO || 'SEM_GRUPO';
      if (!groupVolumes[grupo]) {
        groupVolumes[grupo] = 0;
      }
      groupVolumes[grupo] += incident.volume;
    });

    const totalVolume = Object.values(groupVolumes).reduce((sum, vol) => sum + vol, 0);

    // Cria fatores para grupos significativos (>10% do volume total)
    Object.entries(groupVolumes).forEach(([group, volume]) => {
      const impact = volume / totalVolume;
      if (impact > 0.1) {
        groupFactors.push({
          name: `Grupo: ${group}`,
          impact,
          description: `Impacto significativo do grupo ${group}`
        });
      }
    });

    return groupFactors;
  }

  calculateCorrelations(incidents, factors) {
    const n = Array.isArray(factors) ? factors.length : 0;
    if (n === 0) return [];
    const correlationMatrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else if (i < j) {
          correlationMatrix[i][j] = this.calculateFactorCorrelation(
            factors[i],
            factors[j],
            incidents
          );
          correlationMatrix[j][i] = correlationMatrix[i][j];
        }
      }
    }
    return correlationMatrix;
  }

  calculateFactorCorrelation(factor1, factor2, incidents) {
    // Implementação simplificada de correlação
    // Na prática, isso dependeria da natureza específica dos fatores
    return Math.min(
      Math.abs(factor1.impact - factor2.impact),
      Math.random() * 0.5 // Adiciona alguma variação aleatória para demonstração
    );
  }

  rankFactorsByImpact(factors, correlations) {
    // Calcula o score de cada fator considerando seu impacto e correlações
    const scores = factors.map((factor, idx) => {
      const correlationScore = correlations[idx].reduce((sum, corr) => sum + corr, 0) / correlations.length;
      return {
        ...factor,
        score: factor.impact * (1 + correlationScore) / 2
      };
    });

    // Ordena por score e remove o campo score
    return scores
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...factor }) => factor);
  }
}

module.exports = InfluenceFactorsService; 