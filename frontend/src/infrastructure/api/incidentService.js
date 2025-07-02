import api from './axiosConfig';

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD)
 * @param {Date|string} date - Data para formatar
 * @returns {string} Data formatada
 */
const formatDate = (date) => {
    if (!date) return '';
    
    // Se já for string, verificar se está no formato ISO
    if (typeof date === 'string') {
        // Verificar se a string é um dos períodos predefinidos
        if (['7d', '15d', '30d', '90d'].includes(date)) {
            return date;
        }
        
        // Verificar se já está no formato ISO ou similar
        if (date.match(/^\d{4}-\d{2}-\d{2}(T|$)/)) {
            return date.split('T')[0]; // Retorna apenas a parte da data
        }
        
        // Tentar converter para Date e depois para ISO
        try {
            const dateObj = new Date(date);
            return dateObj.toISOString().split('T')[0];
        } catch (e) {
            console.warn('Erro ao converter string de data:', e);
            return date;
        }
    }
    
    // Se for objeto Date
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    
    // Se não for nenhum dos casos acima, retorna vazio
    console.warn('Formato de data desconhecido:', date);
    return '';
};

const incidentService = {
    /**
     * Busca dados de análise temporal de incidentes
     * @param {string|Date} startDate - Data inicial ou período ('7d', '15d', '30d', '90d')
     * @param {Date} [endDate] - Data final (opcional)
     * @param {string} [group] - Grupo para filtrar (opcional)
     * @returns {Promise} Dados de análise temporal
     */
    async getTimelineAnalysis(startDate, endDate = null, group = '') {
        console.log('🔍 [DEBUG TIMELINE] getTimelineAnalysis chamado');
        console.log('🔍 [DEBUG TIMELINE] Parâmetros:', { startDate, endDate, group });
        
        try {
            // URL para análise temporal
            let url = '/incidents/analysis/timeline';
            let params = {};

            // Se startDate for um período predefinido
            if (typeof startDate === 'string' && ['7d', '15d', '30d', '90d'].includes(startDate)) {
                params.period = startDate;
            } else {
                // Formata as datas
                const formattedStartDate = formatDate(startDate);
                const formattedEndDate = formatDate(endDate);
                
                // Adiciona parâmetros à URL diretamente se for análise por período
                url = `/incidents/analysis/timeline?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
                
                // Se houver grupo, adiciona ao parâmetro 
                if (group) {
                    url += `&group=${group}`;
                }
                
                // Para este caso específico, não vamos usar params para evitar problemas de codificação da URL
                params = {};
            }

            console.log('🔍 [DEBUG TIMELINE] Fazendo requisição para:', url, 'com parâmetros:', params);
            const response = await api.get(url, { params });
            console.log('🔍 [DEBUG TIMELINE] Resposta da API recebida:', response.data);
            
            // Se a resposta tiver um campo 'data', retorna o conteúdo desse campo
            if (response.data && response.data.data) {
                return response.data.data;
            }
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar análise temporal:', error);
            throw error;
        }
    },

    /**
     * Busca estatísticas gerais de incidentes
     * @returns {Promise} Estatísticas gerais
     */
    async getStatistics() {
        try {
            console.log('Buscando estatísticas de incidentes');
            const response = await api.get('/incidents/statistics');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    },

    /**
     * Busca incidentes por período e filtros opcionais
     * @param {string} startDate - Data inicial (YYYY-MM-DD)
     * @param {string} endDate - Data final (YYYY-MM-DD)
     * @param {string} [grupo] - Filtro por grupo (opcional)
     * @param {string} [acao] - Filtro por ação (opcional)
     * @returns {Promise} Lista de incidentes
     */
    async getIncidents(startDate, endDate, grupo = '', acao = '') {
        try {
            const params = {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
            };
            
            if (grupo) {
                params.grupo = grupo;
            }
            
            if (acao) {
                params.acao = acao;
            }
            
            console.log('Buscando incidentes com parâmetros:', params);
            const response = await api.get('/incidents', { params });
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar incidentes:', error);
            throw error;
        }
    }
};

export default incidentService; 