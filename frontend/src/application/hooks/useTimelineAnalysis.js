import { useState, useCallback } from 'react';
import incidentService from '../../infrastructure/api/incidentService';

/**
 * Hook personalizado para gerenciar o estado da análise temporal
 * @returns {Object} Estado e funções para análise temporal
 */
const useTimelineAnalysis = () => {
    const [timelineData, setTimelineData] = useState([]);
    const [distributionByAction, setDistributionByAction] = useState([]);
    const [distributionByGroup, setDistributionByGroup] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Converte objetos de ações/grupos para o formato de array usado pelos gráficos
     * @param {Object} obj - Objeto com chaves e valores
     * @returns {Array} Array formatado para gráficos
     */
    const objectToArray = (obj) => {
        if (!obj) return [];
        
        return Object.entries(obj).map(([name, value]) => ({
            name,
            value
        }));
    };
    
    /**
     * Formata dailyData para o formato esperado pelo gráfico de linha
     * @param {Array} dailyData - Dados diários do backend
     * @returns {Array} Dados formatados para o gráfico
     */
    const formatDailyData = (dailyData) => {
        if (!dailyData || !Array.isArray(dailyData)) return [];
        
        return dailyData.map(item => ({
            date: item.data,
            incidents: item.quantidade
        }));
    };
    
    /**
     * Formata dados de grupos para o formato esperado pelo gráfico de pizza
     * @param {Array} gruposData - Dados de grupos do backend
     * @returns {Array} Dados formatados para o gráfico
     */
    const formatGruposData = (gruposData) => {
        if (!gruposData || !Array.isArray(gruposData)) return [];
        
        return gruposData.map(item => ({
            name: item.GRUPO_DIRECIONADO || 'Sem grupo',
            value: item.total
        }));
    };

    /**
     * Extrai dados da resposta da API conforme a estrutura
     * @param {Object} data - Dados recebidos da API
     * @returns {Object} Dados estruturados para os gráficos
     */
    const extractDataFromResponse = (data) => {
        console.log('Processando resposta da API:', data);
        
        let extractedData = {
            timeline: [],
            distributionByAction: [],
            distributionByGroup: []
        };
        
        // Tenta extrair os dados de acordo com a estrutura específica que vem da API
        if (data) {
            // Processa dados diários (gráfico de linha)
            if (data.dailyData && Array.isArray(data.dailyData)) {
                extractedData.timeline = formatDailyData(data.dailyData);
            } else if (data.timeline && Array.isArray(data.timeline)) {
                extractedData.timeline = data.timeline;
            } else if (data.data && Array.isArray(data.data)) {
                extractedData.timeline = data.data;
            } else if (data.incidents && Array.isArray(data.incidents)) {
                extractedData.timeline = data.incidents;
            } else if (Array.isArray(data)) {
                extractedData.timeline = data;
            }
            
            // Processa distribuição por ação (gráfico de pizza)
            if (data.acoes && typeof data.acoes === 'object') {
                extractedData.distributionByAction = objectToArray(data.acoes);
            } else if (data.distributionByAction && Array.isArray(data.distributionByAction)) {
                extractedData.distributionByAction = data.distributionByAction;
            } else if (data.actionDistribution && Array.isArray(data.actionDistribution)) {
                extractedData.distributionByAction = data.actionDistribution;
            } else if (data.byAction && Array.isArray(data.byAction)) {
                extractedData.distributionByAction = data.byAction;
            }
            
            // Processa distribuição por grupo (gráfico de pizza)
            if (data.gruposData && Array.isArray(data.gruposData)) {
                extractedData.distributionByGroup = formatGruposData(data.gruposData);
            } else if (data.distributionByGroup && Array.isArray(data.distributionByGroup)) {
                extractedData.distributionByGroup = data.distributionByGroup;
            } else if (data.groupDistribution && Array.isArray(data.groupDistribution)) {
                extractedData.distributionByGroup = data.groupDistribution;
            } else if (data.byGroup && Array.isArray(data.byGroup)) {
                extractedData.distributionByGroup = data.byGroup;
            }
        }
        
        console.log('Dados extraídos:', extractedData);
        return extractedData;
    };

    /**
     * Carrega os dados da análise temporal
     * @param {Date|string} startDate - Data inicial
     * @param {Date|string} endDate - Data final
     * @param {string} group - Grupo para filtrar
     */
    const loadTimelineData = useCallback(async (startDate, endDate, group = '') => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Solicitando dados de análise temporal com:', { startDate, endDate, group });
            const response = await incidentService.getTimelineAnalysis(startDate, endDate, group);
            console.log('Resposta recebida da API:', response);
            
            // Extrai e processa os dados da resposta
            const extractedData = extractDataFromResponse(response);
            
            setTimelineData(extractedData.timeline);
            setDistributionByAction(extractedData.distributionByAction);
            setDistributionByGroup(extractedData.distributionByGroup);
            
        } catch (err) {
            setError('Erro ao carregar dados da análise temporal: ' + err.message);
            console.error('Erro ao carregar dados da análise temporal:', err);
            
            // Reinicializa os dados em caso de erro
            setTimelineData([]);
            setDistributionByAction([]);
            setDistributionByGroup([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        timelineData,
        distributionByAction,
        distributionByGroup,
        loading,
        error,
        loadTimelineData
    };
};

export default useTimelineAnalysis; 