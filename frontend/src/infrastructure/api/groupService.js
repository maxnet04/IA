import axiosConfig from './axiosConfig';

/**
 * Serviço para operações relacionadas a grupos
 */
class GroupService {
    constructor() {
        this.baseURL = '/groups';
    }

    /**
     * Obtém lista de todos os grupos disponíveis
     * @returns {Promise<Array>} Lista de grupos
     */
    async getAllGroups() {
        try {
            const response = await axiosConfig.get(this.baseURL);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Obtém detalhes de um grupo específico
     * @param {string} groupId ID do grupo
     * @returns {Promise<Object>} Detalhes do grupo
     */
    async getGroupDetails(groupId) {
        try {
            const response = await axiosConfig.get(`${this.baseURL}/${groupId}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar detalhes do grupo ${groupId}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Gera previsões de volume para um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros da previsão
     * @returns {Promise<Object>} Previsões de volume
     */
    async predictGroupVolume(groupId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.date) queryParams.append('date', params.date);
            if (params.daysForward) queryParams.append('daysForward', params.daysForward.toString());

            const response = await axiosConfig.get(
                `${this.baseURL}/${groupId}/predict?${queryParams.toString()}`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao gerar previsões para o grupo ${groupId}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Detecta anomalias em um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros da detecção
     * @returns {Promise<Object>} Anomalias detectadas
     */
    async detectGroupAnomalies(groupId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.severity) queryParams.append('severity', params.severity);
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await axiosConfig.get(
                `${this.baseURL}/${groupId}/anomalies?${queryParams.toString()}`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao detectar anomalias para o grupo ${groupId}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Gera recomendações para um grupo
     * @param {string} groupId ID do grupo
     * @returns {Promise<Object>} Recomendações geradas
     */
    async generateGroupRecommendations(groupId) {
        try {
            const response = await axiosConfig.get(`${this.baseURL}/${groupId}/recommendations`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao gerar recomendações para o grupo ${groupId}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Obtém métricas de um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} params Parâmetros das métricas
     * @returns {Promise<Object>} Métricas do grupo
     */
    async getGroupMetrics(groupId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await axiosConfig.get(
                `${this.baseURL}/${groupId}/metrics?${queryParams.toString()}`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao obter métricas do grupo ${groupId}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Manipula erros da API de forma consistente
     * @param {Error} error Erro da requisição
     * @returns {Error} Erro processado
     * @private
     */
    handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 400:
                    return new Error(data.error || 'Parâmetros inválidos para a operação');
                case 401:
                    return new Error('Não autorizado. Faça login novamente.');
                case 403:
                    return new Error('Acesso negado para esta operação');
                case 404:
                    return new Error(data.error || 'Grupo não encontrado');
                case 500:
                    return new Error(data.error || 'Erro interno do servidor');
                default:
                    return new Error(`Erro ${status}: ${data.error || 'Erro desconhecido'}`);
            }
        } else if (error.request) {
            return new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
            return new Error(error.message || 'Erro inesperado');
        }
    }

    /**
     * Valida se um groupId é válido
     * @param {string} groupId ID do grupo
     * @returns {boolean} Se o groupId é válido
     */
    static isValidGroupId(groupId) {
        return groupId && typeof groupId === 'string' && groupId.length > 0;
    }

    /**
     * Formata dados de grupo para exibição
     * @param {Object} groupData Dados do grupo
     * @returns {Object} Dados formatados
     */
    static formatGroupData(groupData) {
        if (!groupData) return null;

        return {
            ...groupData,
            displayName: groupData.group_name || groupData.group_id || 'Grupo sem nome',
            totalIncidents: parseInt(groupData.total_incidents) || 0,
            resolvedCount: parseInt(groupData.resolved_count) || 0,
            resolvedPercentage: groupData.total_incidents > 0 
                ? ((groupData.resolved_count / groupData.total_incidents) * 100).toFixed(1)
                : '0.0'
        };
    }
}

// Instância singleton
const groupService = new GroupService();
export default groupService;
 