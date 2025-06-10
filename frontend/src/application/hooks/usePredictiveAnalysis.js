import { useState, useCallback, useEffect } from 'react';
import predictiveService from '../../infrastructure/api/predictiveService';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

/**
 * Hook personalizado para gerenciar o estado da análise preditiva
 * @returns {Object} Estado e funções para análise preditiva
 */
const usePredictiveAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [date, setDate] = useState('');
    const [productId, setProductId] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [cache, setCache] = useState({});
    const [volumeAnalysis, setVolumeAnalysis] = useState(null);
    const [influenceFactors, setInfluenceFactors] = useState([]);
    const [loadingInfluenceFactors, setLoadingInfluenceFactors] = useState(false);
    const [errorInfluenceFactors, setErrorInfluenceFactors] = useState(null);

    // Função para verificar se os dados estão em cache e ainda são válidos
    const getCachedData = useCallback((key) => {
        const cached = cache[key];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cache]);

    // Função para salvar dados no cache
    const setCachedData = useCallback((key, data) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }));
    }, []);

    /**
     * Atualiza a data para previsão
     * @param {string} newDate - Nova data
     */
    const handleDateChange = useCallback((newDate) => {
        setDate(newDate);
    }, []);

    /**
     * Atualiza o ID do produto
     * @param {string} newProductId - Novo ID do produto
     */
    const handleProductIdChange = useCallback((newProductId) => {
        setProductId(newProductId);
    }, []);

    /**
     * Carrega os dados de análise preditiva
     */
    const loadPrediction = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);

        try {
            const currentProductId = filters.productId || productId;
            if (!currentProductId?.trim()) {
                throw new Error('ID do produto é obrigatório');
            }

            const result = await predictiveService.getPredictedVolume(
                filters.startDate || date,
                currentProductId.trim()
            );
            
            console.log('Resposta da API de volume:', result);

            if (!result.success) {
                throw new Error(result.error || 'Erro ao obter previsões');
            }

            // Não precisa formatar os dados, usa direto da API
            setPrediction(result);
            setPredictions(result);

            // Carrega dados relacionados com filtros
            const [anomaliesResult, recommendationsResult, metricsResult] = await Promise.all([
                predictiveService.detectAnomalies(currentProductId, filters.startDate || date, filters.endDate || date),
                predictiveService.getRecommendations(currentProductId),
                predictiveService.getDetailedMetrics(currentProductId, filters.startDate || date, filters.endDate || date)
            ]);

            console.log('Dados complementares:', {
                anomalias: anomaliesResult,
                recomendacoes: recommendationsResult,
                metricas: metricsResult
            });

            setAnomalies(anomaliesResult.data?.anomalies || []);
            setRecommendations(recommendationsResult.data?.recommendations || []);
            setMetrics(metricsResult.data);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError(err.message || 'Erro ao carregar dados');
            setPredictions(null);
            setAnomalies([]);
            setRecommendations([]);
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    }, [productId, date]);

    /**
     * Função loadPredictions para manter compatibilidade com o componente
     * @param {string} prodId - ID do produto
     * @param {string} selectedDate - Data selecionada
     */
    const loadPredictions = useCallback((prodId, selectedDate) => {
        if (!prodId?.trim() || !selectedDate) return;
        
        const trimmedProdId = prodId.trim();
        setProductId(trimmedProdId);
        setDate(selectedDate);
        
        return loadPrediction({
            startDate: selectedDate,
            endDate: selectedDate,
            productId: trimmedProdId
        });
    }, [loadPrediction]);

    /**
     * Limpa todos os dados da análise
     */
    const clearData = useCallback(() => {
        setPrediction(null);
        setPredictions(null);
        setAnomalies([]);
        setRecommendations([]);
        setMetrics(null);
        setError(null);
        setDate('');
        setProductId('');
    }, []);

    const loadVolumeAnalysis = useCallback(async (productId, targetDate, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await predictiveService.getVolumeAnalysis(
                productId,
                targetDate,
                options
            );

            if (!result.success) {
                throw new Error(result.error || 'Erro ao carregar análise');
            }

            setVolumeAnalysis(result.data);
        } catch (err) {
            console.error('Erro ao carregar análise:', err);
            setError(err.message || 'Erro ao carregar dados');
            setVolumeAnalysis(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carrega os fatores de influência para um produto e período
     */
    const loadInfluenceFactors = useCallback(async (productId, startDate, endDate) => {
        setLoadingInfluenceFactors(true);
        setErrorInfluenceFactors(null);
        try {
            const result = await predictiveService.getInfluenceFactors(productId, startDate, endDate);
            if (!result.success) {
                throw new Error(result.error || 'Erro ao carregar fatores de influência');
            }
            setInfluenceFactors(result.data.factors || []);
        } catch (err) {
            setErrorInfluenceFactors(err.message || 'Erro ao carregar fatores de influência');
            setInfluenceFactors([]);
        } finally {
            setLoadingInfluenceFactors(false);
        }
    }, []);

    // Limpa o cache quando o componente é desmontado
    useEffect(() => {
        return () => {
            setCache({});
        };
    }, []);

    return {
        loading,
        error,
        date,
        productId,
        prediction,
        predictions,
        anomalies,
        recommendations,
        metrics,
        volumeAnalysis,
        handleDateChange,
        handleProductIdChange,
        loadPrediction,
        loadPredictions,
        clearData,
        loadVolumeAnalysis,
        influenceFactors,
        loadInfluenceFactors,
        loadingInfluenceFactors,
        errorInfluenceFactors
    };
};

export default usePredictiveAnalysis; 