import { useState, useCallback } from 'react';
import notificationService from '../../infrastructure/api/notificationService';
import predictiveService from '../../infrastructure/api/predictiveService';

/**
 * Hook personalizado para gerenciar histórico de previsões e comparação entre períodos
 * @returns {Object} Estado e funções para histórico de previsões
 */
const usePredictionHistory = () => {
    const [history, setHistory] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [comparisonRange, setComparisonRange] = useState({
        startDate: '',
        endDate: ''
    });

    /**
     * Carrega histórico de previsões
     * @param {string} productId - ID do produto
     * @param {Object} range - Intervalo de datas {startDate, endDate}
     */
    const loadHistory = useCallback(async (productId, range) => {
        if (!productId || !range.startDate || !range.endDate) {
            setError('Parâmetros inválidos');
            return;
        }

        setLoading(true);
        setError(null);
        setDateRange(range);

        try {
            const result = await notificationService.getPredictionHistory(
                productId, 
                range.startDate, 
                range.endDate
            );
            setHistory(result.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Compara dois períodos
     * @param {string} productId - ID do produto
     * @param {Object} currentRange - Intervalo de datas atual {startDate, endDate}
     * @param {Object} previousRange - Intervalo de datas anterior {startDate, endDate}
     */
    const comparePeriods = useCallback(async (productId, currentRange, previousRange) => {
        if (!productId || !currentRange.startDate || !currentRange.endDate || 
            !previousRange.startDate || !previousRange.endDate) {
            setError('Parâmetros inválidos');
            return;
        }

        setLoading(true);
        setError(null);
        setDateRange(currentRange);
        setComparisonRange(previousRange);

        try {
            // Obtém métricas para o período atual
            const currentMetrics = await predictiveService.getDetailedMetrics(
                productId, 
                currentRange.startDate, 
                currentRange.endDate
            );

            // Obtém métricas para o período anterior
            const previousMetrics = await predictiveService.getDetailedMetrics(
                productId, 
                previousRange.startDate, 
                previousRange.endDate
            );

            // Calcula a variação percentual
            const calculateVariation = (current, previous) => {
                if (!previous || previous === 0) return 0;
                return ((current - previous) / previous) * 100;
            };

            // Cria objeto de comparação
            const comparisonData = {
                currentPeriod: currentMetrics.data,
                previousPeriod: previousMetrics.data,
                variations: {
                    volume: calculateVariation(
                        currentMetrics.data?.media_volume_diario || 0,
                        previousMetrics.data?.media_volume_diario || 0
                    ),
                    tempoResolucao: calculateVariation(
                        currentMetrics.data?.tempo_medio_resolucao || 0,
                        previousMetrics.data?.tempo_medio_resolucao || 0
                    ),
                    taxaResolucao: calculateVariation(
                        currentMetrics.data?.taxa_resolucao || 0,
                        previousMetrics.data?.taxa_resolucao || 0
                    )
                }
            };

            setComparison(comparisonData);
        } catch (err) {
            setError(err.message || 'Erro ao comparar períodos');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        history,
        comparison,
        loading,
        error,
        dateRange,
        comparisonRange,
        loadHistory,
        comparePeriods
    };
};

export default usePredictionHistory; 