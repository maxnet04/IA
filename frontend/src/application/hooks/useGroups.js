import { useState, useEffect, useCallback } from 'react';
import groupService from '../../infrastructure/api/groupService';

/**
 * Hook customizado para operações relacionadas a grupos
 */
export const useGroups = () => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Carrega lista de todos os grupos
     */
    const loadGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.getAllGroups();
            setGroups(response.data || []);
        } catch (err) {
            setError(err.message);
            console.error('Erro ao carregar grupos:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carrega detalhes de um grupo específico
     * @param {string} groupId ID do grupo
     */
    const loadGroupDetails = useCallback(async (groupId) => {
        if (!groupId) return;

        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.getGroupDetails(groupId);
            setSelectedGroup(response.data);
        } catch (err) {
            setError(err.message);
            console.error(`Erro ao carregar detalhes do grupo ${groupId}:`, err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Seleciona um grupo da lista
     * @param {string} groupId ID do grupo
     */
    const selectGroup = useCallback((groupId) => {
        const group = groups.find(g => g.group_id === groupId);
        setSelectedGroup(group || null);
    }, [groups]);

    /**
     * Limpa o grupo selecionado
     */
    const clearSelectedGroup = useCallback(() => {
        setSelectedGroup(null);
    }, []);

    /**
     * Limpa erros
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Carrega grupos automaticamente quando o hook é montado
    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    return {
        groups,
        selectedGroup,
        loading,
        error,
        loadGroups,
        loadGroupDetails,
        selectGroup,
        clearSelectedGroup,
        clearError
    };
};

/**
 * Hook para previsões de grupos
 */
export const useGroupPredictions = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Gera previsões para um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros da previsão
     */
    const generatePredictions = useCallback(async (groupId, params = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.predictGroupVolume(groupId, params);
            setPredictions(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            console.error(`Erro ao gerar previsões para o grupo ${groupId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Limpa previsões
     */
    const clearPredictions = useCallback(() => {
        setPredictions([]);
        setError(null);
    }, []);

    return {
        predictions,
        loading,
        error,
        generatePredictions,
        clearPredictions
    };
};

/**
 * Hook para anomalias de grupos
 */
export const useGroupAnomalies = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Detecta anomalias para um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros da detecção
     */
    const detectAnomalies = useCallback(async (groupId, params = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.detectGroupAnomalies(groupId, params);
            setAnomalies(response.data?.anomalies || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            console.error(`Erro ao detectar anomalias para o grupo ${groupId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Limpa anomalias
     */
    const clearAnomalies = useCallback(() => {
        setAnomalies([]);
        setError(null);
    }, []);

    return {
        anomalies,
        loading,
        error,
        detectAnomalies,
        clearAnomalies
    };
};

/**
 * Hook para recomendações de grupos
 */
export const useGroupRecommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Gera recomendações para um grupo
     * @param {string} groupId ID do grupo
     */
    const generateRecommendations = useCallback(async (groupId) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.generateGroupRecommendations(groupId);
            setRecommendations(response.data?.recommendations || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            console.error(`Erro ao gerar recomendações para o grupo ${groupId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Limpa recomendações
     */
    const clearRecommendations = useCallback(() => {
        setRecommendations([]);
        setError(null);
    }, []);

    return {
        recommendations,
        loading,
        error,
        generateRecommendations,
        clearRecommendations
    };
};

/**
 * Hook para métricas de grupos
 */
export const useGroupMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Carrega métricas para um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros das métricas
     */
    const loadMetrics = useCallback(async (groupId, params = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await groupService.getGroupMetrics(groupId, params);
            
            // O backend retorna { success: true, data: { groupId, groupName, period, metrics, groupDetails } }
            // Então metrics está em response.data.metrics
            const metricsData = response?.data || null;
            
            console.log('🔍 [DEBUG] Métricas recebidas:', metricsData);
            
            setMetrics(metricsData);
            return response;
        } catch (err) {
            setError(err.message);
            console.error(`Erro ao carregar métricas para o grupo ${groupId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Limpa métricas
     */
    const clearMetrics = useCallback(() => {
        setMetrics(null);
        setError(null);
    }, []);

    return {
        metrics,
        loading,
        error,
        loadMetrics,
        clearMetrics
    };
};

export default useGroups;
 