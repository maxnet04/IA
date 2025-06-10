const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');

class SeasonalityService {
  constructor() {
    this.incidentRepo = new IncidentRepository();
  }

  async analyzeSeasonality(productId, startDate, endDate, groupBy = 'day_of_week') {
    try {
      const incidents = await this.incidentRepo.getIncidentsByDateRange(
        productId,
        startDate,
        endDate
      );

      const heatmapData = this.createHeatmapData(incidents, groupBy);
      const insights = this.generateSeasonalInsights(heatmapData);

      return {
        success: true,
        data: {
          heatmapData,
          insights
        }
      };
    } catch (error) {
      console.error('Erro ao analisar sazonalidade:', error);
      throw new Error('Falha ao analisar padrões sazonais');
    }
  }

  createHeatmapData(incidents, groupBy) {
    const data = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
        data.push({
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
        data.push({
          month,
          volume: monthlyVolumes[month] || 0
        });
      });
    }

    return data;
  }

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

    const avgDailyVolume = Object.values(dayTotals).reduce((sum, vol) => sum + vol, 0) / weekDays.length;
    
    // Identifica dias de pico (20% acima da média)
    insights.peakDays = weekDays.filter(day => dayTotals[day] > avgDailyVolume * 1.2);

    // Análise de picos mensais
    const monthlyTotals = heatmapData.map(month => ({
      month: month.month,
      total: weekDays.reduce((sum, day) => sum + (month[day] || 0), 0)
    }));

    const avgMonthlyVolume = monthlyTotals.reduce((sum, month) => sum + month.total, 0) / monthlyTotals.length;

    // Identifica meses de pico (20% acima da média)
    insights.peakMonths = monthlyTotals
      .filter(month => month.total > avgMonthlyVolume * 1.2)
      .map(month => month.month);

    // Identifica períodos mais baixos (30% abaixo da média)
    insights.lowestPeriods = monthlyTotals
      .filter(month => month.total < avgMonthlyVolume * 0.7)
      .map(month => month.month);

    // Calcula força da sazonalidade (variação em relação à média)
    const variations = monthlyTotals.map(month => Math.abs(month.total - avgMonthlyVolume) / avgMonthlyVolume);
    insights.seasonalityStrength = Math.round(
      (variations.reduce((sum, var_) => sum + var_, 0) / variations.length) * 100
    ) / 100;

    return insights;
  }
}

module.exports = SeasonalityService; 