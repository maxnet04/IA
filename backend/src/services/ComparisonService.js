const { IncidentRepository } = require('../infrastructure/database/IncidentRepository');

class ComparisonService {
  constructor() {
    this.incidentRepo = new IncidentRepository();
  }

  async comparePeriods(productId, currentPeriod, previousPeriod, comparisonType = 'year_over_year') {
    try {
      // Busca dados dos períodos
      const [currentData, previousData] = await Promise.all([
        this.incidentRepo.getIncidentsByDateRange(
          productId,
          currentPeriod.startDate,
          currentPeriod.endDate
        ),
        this.incidentRepo.getIncidentsByDateRange(
          productId,
          previousPeriod.startDate,
          previousPeriod.endDate
        )
      ]);

      // Agrupa dados por dia
      const currentGrouped = this.groupIncidentsByDate(currentData);
      const previousGrouped = this.groupIncidentsByDate(previousData);

      // Calcula métricas de crescimento
      const growthMetrics = this.calculateGrowthMetrics(currentGrouped, previousGrouped);

      return {
        success: true,
        data: {
          currentPeriod: this.formatPeriodData(currentGrouped),
          previousPeriod: this.formatPeriodData(previousGrouped),
          comparison: growthMetrics
        }
      };
    } catch (error) {
      console.error('Erro ao comparar períodos:', error);
      throw new Error('Falha ao comparar períodos');
    }
  }

  groupIncidentsByDate(incidents) {
    const grouped = {};

    incidents.forEach(incident => {
      const date = incident.incident_date.split('T')[0]; // Remove a parte do tempo
      if (!grouped[date]) {
        grouped[date] = {
          date,
          volume: 0,
          incidents: []
        };
      }
      grouped[date].volume += incident.volume;
      grouped[date].incidents.push(incident);
    });

    return grouped;
  }

  calculateGrowthMetrics(currentData, previousData) {
    const metrics = {
      overallGrowth: 0,
      highestDifference: {
        date: null,
        difference: 0,
        percentageChange: 0
      },
      lowestDifference: {
        date: null,
        difference: 0,
        percentageChange: 0
      }
    };

    // Calcula volume total para cada período
    const currentTotal = Object.values(currentData).reduce((sum, day) => sum + day.volume, 0);
    const previousTotal = Object.values(previousData).reduce((sum, day) => sum + day.volume, 0);

    // Calcula crescimento geral
    metrics.overallGrowth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    // Analisa diferenças diárias
    const allDates = new Set([
      ...Object.keys(currentData),
      ...Object.keys(previousData)
    ]);

    let maxDiff = -Infinity;
    let minDiff = Infinity;

    allDates.forEach(date => {
      const currentVolume = (currentData[date]?.volume || 0);
      const previousVolume = (previousData[date]?.volume || 0);
      const difference = currentVolume - previousVolume;
      const percentageChange = previousVolume > 0 
        ? (difference / previousVolume) * 100 
        : currentVolume > 0 ? 100 : 0;

      // Atualiza maior diferença
      if (difference > maxDiff) {
        maxDiff = difference;
        metrics.highestDifference = {
          date,
          difference,
          percentageChange
        };
      }

      // Atualiza menor diferença
      if (difference < minDiff) {
        minDiff = difference;
        metrics.lowestDifference = {
          date,
          difference,
          percentageChange
        };
      }
    });

    return metrics;
  }

  formatPeriodData(groupedData) {
    return Object.values(groupedData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        date: day.date,
        volume: day.volume,
        categories: this.aggregateCategories(day.incidents)
      }));
  }

  aggregateCategories(incidents) {
    const categories = {};

    incidents.forEach(incident => {
      const category = incident.CATEGORIA;
      if (!categories[category]) {
        categories[category] = {
          volume: 0,
          count: 0
        };
      }
      categories[category].volume += incident.volume;
      categories[category].count++;
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  calculateDailyAverages(data) {
    const totalDays = Object.keys(data).length || 1;
    const totalVolume = Object.values(data).reduce((sum, day) => sum + day.volume, 0);
    
    return {
      averageVolume: totalVolume / totalDays,
      totalVolume,
      totalDays
    };
  }
}

module.exports = ComparisonService; 