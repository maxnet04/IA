const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');
const ScenarioService = require('./ScenarioService');
const SeasonalityService = require('./SeasonalityService');
const InfluenceFactorsService = require('./InfluenceFactorsService');

class RecommendationService {
  constructor() {
    this.incidentRepo = new IncidentRepository();
    this.scenarioService = new ScenarioService();
    this.seasonalityService = new SeasonalityService();
    this.influenceFactorsService = new InfluenceFactorsService();
  }

  async generateRecommendations(productId, date, limit = 3, category = null) {
    try {
      // Coleta dados para análise
      const analysisData = await this.collectAnalysisData(productId, date);
      
      // Gera recomendações baseadas nos dados
      const recommendations = await this.analyzeAndGenerateRecommendations(analysisData);
      
      // Verifica se é uma consulta para todos os produtos e adiciona recomendações específicas
      const isAllProducts = productId === 'ALL';
      if (isAllProducts) {
        // Gera recomendações específicas para análise multi-produto com base nos dados
        const multiProductRecommendations = await this.generateMultiProductRecommendations(analysisData);
        recommendations.push(...multiProductRecommendations);
      }
      
      // Filtra por categoria se especificada
      let filteredRecommendations = recommendations;
      if (category) {
        filteredRecommendations = recommendations.filter(rec => 
          rec.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Prioriza e limita as recomendações
      const prioritizedRecommendations = this.prioritizeRecommendations(filteredRecommendations)
        .slice(0, limit);

      // Adiciona evidências para cada recomendação
      const recommendationsWithEvidence = await Promise.all(
        prioritizedRecommendations.map(async rec => ({
          ...rec,
          supportingEvidence: await this.findEvidenceForRecommendation(rec, analysisData)
        }))
      );

      return {
        success: true,
        data: {
          recommendations: recommendationsWithEvidence
        }
      };
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      throw new Error('Falha ao gerar recomendações');
    }
  }

  async collectAnalysisData(productId, date) {
    const baseDate = new Date(date);
    const threeMonthsAgo = new Date(baseDate);
    threeMonthsAgo.setMonth(baseDate.getMonth() - 3);

    // Coleta dados em paralelo
    const [
      historicalIncidents,
      scenarios,
      seasonality,
      factors
    ] = await Promise.all([
      this.incidentRepo.getIncidentsByDateRange(productId, threeMonthsAgo, baseDate),
      this.scenarioService.generateScenarios(productId, date, { monthsForward: 2 }),
      this.seasonalityService.analyzeSeasonality(productId, threeMonthsAgo.toISOString(), date),
      this.influenceFactorsService.analyzeFactors(productId, {
        startDate: threeMonthsAgo.toISOString(),
        endDate: date
      })
    ]);

    return {
      historicalIncidents,
      scenarios: scenarios.data,
      seasonality: seasonality.data,
      factors: factors.data
    };
  }

  async analyzeAndGenerateRecommendations(analysisData) {
    const recommendations = [];

    // Recomendações baseadas em cenários
    this.generateScenarioBasedRecommendations(analysisData, recommendations);

    // Recomendações baseadas em sazonalidade
    this.generateSeasonalityRecommendations(analysisData, recommendations);

    // Recomendações baseadas em fatores de influência
    this.generateFactorBasedRecommendations(analysisData, recommendations);

    // Recomendações baseadas em anomalias
    this.generateAnomalyRecommendations(analysisData, recommendations);

    return recommendations;
  }

  generateScenarioBasedRecommendations(analysisData, recommendations) {
    const { scenarios } = analysisData;
    
    // Verifica se há dados de cenários disponíveis
    if (!scenarios || !scenarios.baseScenario) {
      // Adiciona uma recomendação padrão se não houver dados de cenários
      recommendations.push({
        title: 'Planejamento Inicial',
        description: 'Estabeleça um plano de monitoramento de volume para coletar mais dados históricos.',
        priority: 'Média',
        category: 'Planejamento',
        impactPercentage: 7.5
      });
      return;
    }
    
    const baseScenario = scenarios.baseScenario;
    const optimisticScenario = scenarios.optimisticScenario;

    // Verifica tendência de crescimento
    const growth = this.calculateGrowthTrend(baseScenario);
    if (growth > 0.15) { // Crescimento significativo
      recommendations.push({
        title: 'Planejamento de Capacidade',
        description: `Aumente a capacidade em ${Math.round(growth * 100)}% para os próximos meses devido à tendência de crescimento identificada.`,
        priority: 'Alta',
        category: 'Capacidade',
        impactPercentage: growth * 100
      });
    } else {
      // Adiciona recomendação padrão para crescimento estável/baixo
      recommendations.push({
        title: 'Manutenção de Capacidade',
        description: 'Mantenha a capacidade atual com ajustes mínimos, pois a tendência de crescimento é estável.',
        priority: 'Baixa',
        category: 'Capacidade',
        impactPercentage: 5.0
      });
    }

    // Verifica diferença entre cenários
    if (optimisticScenario && optimisticScenario.length > 0) {
      const scenarioDiff = this.calculateScenarioDifference(baseScenario, optimisticScenario);
      if (scenarioDiff > 0.2) {
        recommendations.push({
          title: 'Plano de Contingência',
          description: 'Prepare um plano de contingência para lidar com possíveis picos de volume.',
          priority: 'Média',
          category: 'Planejamento',
          impactPercentage: scenarioDiff * 100
        });
      }
    }
  }

  generateSeasonalityRecommendations(analysisData, recommendations) {
    const { seasonality } = analysisData;
    
    // Verifica se há dados de sazonalidade disponíveis
    if (!seasonality || !seasonality.insights) {
      recommendations.push({
        title: 'Análise de Sazonalidade',
        description: 'Inicie coleta de dados para análise de padrões sazonais nos volumes.',
        priority: 'Média',
        category: 'Análise',
        impactPercentage: 8.0
      });
      return;
    }
    
    const { insights } = seasonality;

    if (insights.seasonalityStrength > 0.5) {
      // Recomendações para dias de pico
      if (insights.peakDays && insights.peakDays.length > 0) {
        recommendations.push({
          title: 'Otimização de Recursos',
          description: `Aumente a disponibilidade de recursos nos dias: ${insights.peakDays.join(', ')}.`,
          priority: 'Alta',
          category: 'Recursos',
          impactPercentage: insights.seasonalityStrength * 100
        });
      }

      // Recomendações para meses de pico
      if (insights.peakMonths && insights.peakMonths.length > 0) {
        recommendations.push({
          title: 'Planejamento Sazonal',
          description: `Prepare-se para maior volume nos meses: ${insights.peakMonths.join(', ')}.`,
          priority: 'Alta',
          category: 'Planejamento',
          impactPercentage: insights.seasonalityStrength * 90
        });
      }
    } else {
      // Adiciona recomendação para baixa sazonalidade
      recommendations.push({
        title: 'Distribuição Uniforme',
        description: 'Mantenha uma distribuição uniforme de recursos, pois não há padrões sazonais significativos.',
        priority: 'Baixa',
        category: 'Recursos',
        impactPercentage: 6.0
      });
    }
  }

  generateFactorBasedRecommendations(analysisData, recommendations) {
    const { factors } = analysisData;
    
    // Verifica se há dados de fatores disponíveis
    if (!factors || !factors.factors || !Array.isArray(factors.factors) || factors.factors.length === 0) {
      recommendations.push({
        title: 'Identificação de Fatores',
        description: 'Implemente análise de fatores externos que podem impactar o volume.',
        priority: 'Média',
        category: 'Fatores de Influência',
        impactPercentage: 8.5
      });
      return;
    }
    
    // Contador para verificar se algum fator foi adicionado
    let factorsAdded = 0;
    
    factors.factors.forEach(factor => {
      if (factor.impact > 0.3) {
        recommendations.push({
          title: `Ação sobre ${factor.name}`,
          description: `Implemente ações específicas para gerenciar o impacto de ${factor.name}: ${factor.description}`,
          priority: factor.impact > 0.5 ? 'Alta' : 'Média',
          category: 'Fatores de Influência',
          impactPercentage: factor.impact * 100
        });
        factorsAdded++;
      }
    });
    
    // Se nenhum fator significativo foi encontrado, adiciona recomendação padrão
    if (factorsAdded === 0) {
      recommendations.push({
        title: 'Monitoramento de Fatores',
        description: 'Continue monitorando fatores externos, apesar de nenhum ter impacto significativo no momento.',
        priority: 'Baixa',
        category: 'Fatores de Influência',
        impactPercentage: 5.0
      });
    }
  }

  generateAnomalyRecommendations(analysisData, recommendations) {
    const { historicalIncidents } = analysisData;
    
    // Verifica se há dados de incidentes disponíveis
    if (!historicalIncidents || !Array.isArray(historicalIncidents) || historicalIncidents.length === 0) {
      recommendations.push({
        title: 'Detecção de Anomalias',
        description: 'Implemente um sistema básico de detecção de anomalias para monitorar padrões incomuns.',
        priority: 'Média',
        category: 'Anomalias',
        impactPercentage: 7.0
      });
      return;
    }
    
    const anomalies = historicalIncidents.filter(inc => inc.is_anomaly);
    
    if (anomalies.length > 0) {
      const anomalyRate = anomalies.length / historicalIncidents.length;
      
      if (anomalyRate > 0.1) {
        recommendations.push({
          title: 'Gestão de Anomalias',
          description: 'Implemente um sistema de detecção precoce de anomalias devido à alta taxa de ocorrência.',
          priority: 'Alta',
          category: 'Anomalias',
          impactPercentage: anomalyRate * 100
        });
      } else {
        recommendations.push({
          title: 'Monitoramento de Anomalias',
          description: 'Continue monitorando anomalias ocasionais para identificar padrões emergentes.',
          priority: 'Baixa',
          category: 'Anomalias',
          impactPercentage: anomalyRate * 50
        });
      }
    } else {
      recommendations.push({
        title: 'Prevenção de Anomalias',
        description: 'Mantenha o atual processo de prevenção de anomalias, que tem se mostrado eficaz.',
        priority: 'Baixa',
        category: 'Anomalias',
        impactPercentage: 5.0
      });
    }
  }

  calculateGrowthTrend(baseScenario) {
    if (baseScenario.length < 2) return 0;
    
    const firstWeek = baseScenario.slice(0, 7);
    const lastWeek = baseScenario.slice(-7);
    
    const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.predictedVolume, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.predictedVolume, 0) / lastWeek.length;
    
    return (lastWeekAvg - firstWeekAvg) / firstWeekAvg;
  }

  calculateScenarioDifference(baseScenario, optimisticScenario) {
    if (!baseScenario.length || !optimisticScenario.length) return 0;
    
    const baseAvg = baseScenario.reduce((sum, day) => sum + day.predictedVolume, 0) / baseScenario.length;
    const optAvg = optimisticScenario.reduce((sum, day) => sum + day.predictedVolume, 0) / optimisticScenario.length;
    
    return (optAvg - baseAvg) / baseAvg;
  }

  prioritizeRecommendations(recommendations) {
    // Calcula score baseado em prioridade e impacto
    const withScores = recommendations.map(rec => ({
      ...rec,
      score: this.calculateRecommendationScore(rec)
    }));

    // Ordena por score e remove o campo score
    return withScores
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...rec }) => rec);
  }

  calculateRecommendationScore(recommendation) {
    const priorityWeights = {
      'Alta': 1,
      'Média': 0.6,
      'Baixa': 0.3
    };

    const categoryWeights = {
      'Capacidade': 1,
      'Recursos': 0.9,
      'Planejamento': 0.8,
      'Anomalias': 0.7,
      'Fatores de Influência': 0.6
    };

    const priorityScore = priorityWeights[recommendation.priority] || 0.5;
    const categoryScore = categoryWeights[recommendation.category] || 0.5;
    const impactScore = recommendation.impactPercentage / 100;

    return (priorityScore * 0.4 + categoryScore * 0.3 + impactScore * 0.3);
  }

  async findEvidenceForRecommendation(recommendation, analysisData) {
    const evidence = [];

    // Verificação se o objeto analysisData existe
    if (!analysisData) {
      // Retorna evidência genérica quando não há dados
      return [{
        type: 'general',
        description: 'Baseado em análise de recomendações padrão'
      }];
    }

    // Evidência baseada em dados históricos
    if (analysisData.historicalIncidents && Array.isArray(analysisData.historicalIncidents) && analysisData.historicalIncidents.length > 0) {
      evidence.push({
        type: 'historical',
        description: `Baseado em ${analysisData.historicalIncidents.length} incidentes históricos`
      });
    }

    // Evidência baseada em sazonalidade
    if (analysisData.seasonality && 
        analysisData.seasonality.insights && 
        typeof analysisData.seasonality.insights.seasonalityStrength === 'number' &&
        !isNaN(analysisData.seasonality.insights.seasonalityStrength) &&
        analysisData.seasonality.insights.seasonalityStrength > 0) {
      
      const strengthPercentage = Math.round(analysisData.seasonality.insights.seasonalityStrength * 100);
      if (strengthPercentage > 0) {
        evidence.push({
          type: 'seasonality',
          description: `Força da sazonalidade: ${strengthPercentage}%`
        });
      }
    } else {
      // Se não houver dados válidos de sazonalidade, fornecer uma evidência alternativa
      evidence.push({
        type: 'pattern',
        description: 'Análise de padrões de demanda'
      });
    }

    // Evidência baseada em fatores de influência
    if (analysisData.factors && 
        analysisData.factors.factors && 
        Array.isArray(analysisData.factors.factors)) {
      const relevantFactors = analysisData.factors.factors
        .filter(f => f && typeof f.impact === 'number' && !isNaN(f.impact) && f.impact > 0.2 && f.name)
        .map(f => f.name);
      
      if (relevantFactors.length > 0) {
        evidence.push({
          type: 'factors',
          description: `Fatores significativos: ${relevantFactors.join(', ')}`
        });
      }
    }

    // Evidência baseada em cenários
    if (analysisData.scenarios && 
        analysisData.scenarios.baseScenario && 
        Array.isArray(analysisData.scenarios.baseScenario) && 
        analysisData.scenarios.baseScenario.length > 0) {
      
      let scenarioDescription = 'Baseado em análise de cenários';
      
      // Adicionar detalhes específicos com base na categoria da recomendação
      if (recommendation.category === 'Capacidade') {
        const volatility = this.calculateVolatility(analysisData.scenarios.baseScenario);
        if (!isNaN(volatility) && volatility > 0) {
          scenarioDescription += ` (volatilidade: ${(volatility * 100).toFixed(1)}%)`;
        }
      }
      
      evidence.push({
        type: 'scenario',
        description: scenarioDescription
      });
    }
    
    // Se não encontramos nenhuma evidência específica, adicionar uma evidência genérica
    if (evidence.length === 0) {
      evidence.push({
        type: 'general',
        description: 'Baseado em análise de tendências gerais'
      });
    }

    return evidence;
  }

  // Método para gerar recomendações específicas para análise multi-produto
  async generateMultiProductRecommendations(analysisData) {
    const recommendations = [];
    
    // Verifica se os dados de análise estão disponíveis
    if (!analysisData) {
      // Retorna recomendações padrão se não houver dados
      return [
        {
          title: "Estratégia de Diversificação Básica",
          description: "Inicie a coleta de dados para análise multi-produto para otimizar recursos",
          priority: "Média",
          category: "Estratégia",
          impactPercentage: 7.5
        }
      ];
    }
    
    const { scenarios, seasonality, factors } = analysisData;
    
    // Verifica variabilidade entre produtos (se disponível nos dados)
    const hasHighVariability = this.detectHighVariabilityAcrossProducts(analysisData);
    if (hasHighVariability) {
      recommendations.push({
        title: "Estratégia de Diversificação",
        description: "Distribua recursos entre produtos para mitigar riscos de picos isolados",
        priority: "Alta",
        category: "Estratégia",
        impactPercentage: this.calculateDiversificationImpact(analysisData)
      });
    }
    
    // Verifica padrões em comum entre produtos
    const hasCommonPatterns = this.detectCommonPatterns(analysisData);
    if (hasCommonPatterns) {
      recommendations.push({
        title: "Análise Multi-produto",
        description: "Identifique padrões em comum entre produtos para otimizar recursos",
        priority: "Alta",
        category: "Análise",
        impactPercentage: this.calculatePatternAnalysisImpact(analysisData)
      });
    }
    
    // Verifica correlação entre fatores de influência
    if (factors && factors.factors && Array.isArray(factors.factors) && factors.factors.length > 0) {
      recommendations.push({
        title: "Gestão Integrada de Fatores",
        description: "Implemente estratégia unificada para fatores que afetam múltiplos produtos",
        priority: "Média",
        category: "Fatores",
        impactPercentage: this.calculateFactorsImpact(factors)
      });
    }
    
    // Garantir que haja pelo menos uma recomendação
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Coleta de Dados Multi-produto",
        description: "Implemente sistema de coleta de dados para início de análise entre produtos",
        priority: "Média",
        category: "Análise",
        impactPercentage: 7.0
      });
    }
    
    return recommendations;
  }
  
  // Método para detectar alta variabilidade entre produtos
  detectHighVariabilityAcrossProducts(analysisData) {
    // Verificação de dados nulos/indefinidos
    if (!analysisData || !analysisData.scenarios) {
      return true; // Default conservador: assume variabilidade
    }
    
    // Em uma implementação completa, isso analisaria dados de vários produtos
    // Como simplificação, assumimos variabilidade com base nos cenários
    const { scenarios } = analysisData;
    
    if (scenarios && scenarios.baseScenario && Array.isArray(scenarios.baseScenario) && scenarios.baseScenario.length > 0) {
      // Verifica se há diferença significativa entre cenários como proxy para variabilidade
      const hasVariableScenarios = 
        scenarios.optimisticScenario && 
        Array.isArray(scenarios.optimisticScenario) &&
        scenarios.optimisticScenario.length > 0 &&
        scenarios.pessimisticScenario && 
        Array.isArray(scenarios.pessimisticScenario) &&
        scenarios.pessimisticScenario.length > 0 &&
        this.calculateScenarioDifference(scenarios.baseScenario, scenarios.optimisticScenario) > 0.15;
      
      return hasVariableScenarios;
    }
    
    // Caso não tenhamos dados suficientes, retornamos true para ser conservador
    return true;
  }
  
  // Método para detectar padrões comuns entre produtos
  detectCommonPatterns(analysisData) {
    // Verificação de dados nulos/indefinidos
    if (!analysisData || !analysisData.seasonality) {
      return true; // Default conservador: assume padrões comuns
    }
    
    // Em uma implementação completa, isso analisaria padrões entre produtos
    // Como simplificação, verificamos se há sazonalidade forte
    const { seasonality } = analysisData;
    
    if (seasonality && seasonality.insights && typeof seasonality.insights.seasonalityStrength === 'number') {
      return seasonality.insights.seasonalityStrength > 0.4;
    }
    
    // Caso não tenhamos dados de sazonalidade, retornamos true para ser conservador
    return true;
  }
  
  // Calcula o impacto estimado da diversificação
  calculateDiversificationImpact(analysisData) {
    // Verificação de dados nulos/indefinidos
    if (!analysisData || !analysisData.scenarios || !analysisData.scenarios.baseScenario) {
      return 9.5; // Valor padrão
    }
    
    // Em uma implementação completa, isso usaria métricas reais
    // Como simplificação, usamos cenários como base
    if (analysisData.scenarios && 
        analysisData.scenarios.baseScenario && 
        Array.isArray(analysisData.scenarios.baseScenario) &&
        analysisData.scenarios.baseScenario.length > 0) {
      const volatility = this.calculateVolatility(analysisData.scenarios.baseScenario);
      // Impacto estimado da diversificação é proporcional à volatilidade
      return Math.min(Math.round(volatility * 100), 15);
    }
    
    return 9.5; // Valor padrão
  }
  
  // Calcula o impacto estimado da análise de padrões
  calculatePatternAnalysisImpact(analysisData) {
    // Verificação de dados nulos/indefinidos
    if (!analysisData || !analysisData.seasonality || !analysisData.seasonality.insights) {
      return 10.2; // Valor padrão
    }
    
    // Em uma implementação completa, isso seria baseado em dados reais
    // Como simplificação, usamos a força da sazonalidade
    if (analysisData.seasonality && 
        analysisData.seasonality.insights && 
        typeof analysisData.seasonality.insights.seasonalityStrength === 'number') {
      return Math.round(analysisData.seasonality.insights.seasonalityStrength * 20);
    }
    
    return 10.2; // Valor padrão
  }
  
  // Calcula o impacto estimado de gerenciar fatores de influência
  calculateFactorsImpact(factors) {
    if (factors && factors.factors && factors.factors.length > 0) {
      // Calcula média dos impactos de todos os fatores
      const avgImpact = factors.factors.reduce((sum, factor) => 
        sum + (factor.impact || 0), 0) / factors.factors.length;
      
      return Math.round(avgImpact * 100);
    }
    
    return 8.5; // Valor padrão
  }
  
  // Calcula volatilidade de uma série de dados
  calculateVolatility(timeSeries) {
    if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length < 2) return 0.1;
    
    try {
      // Calcula valores e média
      const values = timeSeries
        .map(item => item.predictedVolume || item.volume || 0)
        .filter(value => !isNaN(value) && value >= 0);
      
      // Se não tivermos valores válidos suficientes, retorne um valor padrão
      if (values.length < 2) return 0.1;
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Se a média for zero ou muito pequena, evita divisão por zero
      if (avg <= 0.00001) return 0.1;
      
      // Calcula desvio padrão dividido pela média (coeficiente de variação)
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Certifica-se de que o resultado é válido e dentro de limites razoáveis
      const volatility = stdDev / avg;
      if (isNaN(volatility) || volatility <= 0) return 0.1;
      if (volatility > 1) return 1; // Limita a volatilidade a 100%
      
      return volatility;
    } catch (error) {
      console.error('Erro ao calcular volatilidade:', error);
      return 0.1; // Valor padrão em caso de erro
    }
  }
}

module.exports = RecommendationService; 