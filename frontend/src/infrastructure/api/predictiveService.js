import api from './axiosConfig';

const predictiveService = {
    /**
     * Obtém previsão de volume para uma data específica
     * @param {string} date - Data para previsão
     * @param {string} groupId - ID do grupo
     * @returns {Promise} Dados da previsão
     */
    async getPredictedVolume(date, groupId) {
        try {
            const response = await api.get('/predictive/volume', {
                params: { date, groupId }
            });
            
            return {
                success: true,
                data: response.data.data || response.data
            };
        } catch (error) {
            console.error('Erro ao obter previsão de volume:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter previsões'
            };
        }
    },

    /**
     * Detecta anomalias nos dados históricos
     * @param {string} groupId - ID do grupo
     * @param {string} startDate - Data inicial (opcional)
     * @param {string} endDate - Data final (opcional)
     * @param {string} severity - Severidade da anomalia (opcional)
     * @param {number} limit - Número máximo de anomalias a retornar (opcional)
     * @returns {Promise} Lista de anomalias detectadas
     */
    async detectAnomalies(groupId, startDate, endDate, severity, limit) {
        console.log('🔍 [DEBUG ANOMALIES] predictiveService.detectAnomalies chamado');
        console.log('🔍 [DEBUG ANOMALIES] Parâmetros:', { groupId, startDate, endDate, severity, limit });
        
        try {
            console.log(`🔍 [DEBUG ANOMALIES] Solicitando anomalias: groupId=${groupId}, startDate=${startDate}, endDate=${endDate}, severity=${severity}, limit=${limit}`);
            console.log('🔍 [DEBUG ANOMALIES] Fazendo requisição GET /predictive/anomalies...');
            
            const response = await api.get('/predictive/anomalies', {
                params: { 
                    groupId, 
                    startDate, 
                    endDate,
                    severity,
                    limit 
                }
            });
            
            // Log do response para debugging
            console.log('🔍 [DEBUG ANOMALIES] Resposta da API de anomalias:', response.data);
            
            // Garantimos resposta padronizada mesmo em caso de sucesso parcial
            if (response.data && !response.data.data) {
                return {
                    success: true,
                    data: {
                        anomalies: []
                    }
                };
            }
            
            return response.data;
        } catch (error) {
            console.error('Erro ao detectar anomalias:', error);
            // Retornamos um objeto de erro com a mesma estrutura da resposta de sucesso
            return {
                success: false,
                error: error.message || 'Erro desconhecido ao detectar anomalias',
                data: {
                    anomalies: []
                }
            };
        }
    },

    /**
     * Gera recomendações baseadas em análise preditiva
     * @param {string} groupId - ID do grupo
     * @param {string} date - Data para análise
     * @param {string} category - Categoria da recomendação (opcional)
     * @param {number} limit - Número máximo de recomendações (opcional)
     * @returns {Promise} Lista de recomendações
     */
    async getRecommendations(groupId, date, category = null, limit = 3) {
        console.log('🔍 [DEBUG] predictiveService.getRecommendations chamado');
        console.log('🔍 [DEBUG] Parâmetros:', { groupId, date, category, limit });
        
        try {
            console.log('🔍 [DEBUG] Fazendo requisição GET /predictive/recommendations...');
            const response = await api.get('/predictive/recommendations', {
                params: { 
                    groupId, 
                    date,
                    category,
                    limit 
                }
            });
            

            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Erro ao obter recomendações:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter recomendações'
            };
        }
    },

    /**
     * Obtém métricas detalhadas
     * @param {string} groupId - ID do grupo
     * @param {string} startDate - Data inicial (opcional)
     * @param {string} endDate - Data final (opcional)
     * @param {string} groupBy - Agrupamento das métricas (opcional)
     * @returns {Promise} Métricas detalhadas
     */
    async getDetailedMetrics(groupId, startDate, endDate, groupBy) {
        try {
            const response = await api.get('/predictive/metrics', {
                params: { 
                    groupId, 
                    startDate, 
                    endDate,
                    groupBy 
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao obter métricas:', error);
            throw error;
        }
    },

    /**
     * Exporta dados de análise em formato CSV
     * @param {string} groupId - ID do grupo
     * @param {string} type - Tipo de dados (anomalies, recommendations, metrics)
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise} Dados em formato CSV
     */
    async exportData(groupId, type, filters = {}) {
        try {
            const response = await api.get(`/predictive/export/${type}`, {
                params: { 
                    groupId,
                    ...filters
                },
                responseType: 'blob'
            });
            
            // Cria um link para download do arquivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${groupId}_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            return response.data;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw error;
        }
    },

    /**
     * Obtém análise completa de volume com histórico e previsões
     * @param {string} groupId - ID do grupo
     * @param {string} targetDate - Data alvo
     * @param {Object} options - Opções adicionais
     * @returns {Promise} Dados da análise
     */
    async getVolumeAnalysis(groupId, targetDate, options = {}) {
        try {
            const response = await api.get('/predictive/volume-analysis', {
                params: { 
                    groupId,
                    targetDate,
                    monthsBack: options.monthsBack || 3,
                    monthsForward: options.monthsForward || 2
                }
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Erro ao obter análise de volume:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter análise'
            };
        }
    },

    /**
     * Obtém fatores de influência para um grupo em um período
     * @param {string} groupId - ID do grupo
     * @param {string} startDate - Data inicial (YYYY-MM-DD)
     * @param {string} endDate - Data final (YYYY-MM-DD)
     * @returns {Promise} Fatores de influência
     */
    async getInfluenceFactors(groupId, startDate, endDate) {
        try {
            const response = await api.get('/predictive/influence-factors', {
                params: { groupId, startDate, endDate }
            });
            return {
                success: true,
                data: response.data.factors ? response.data : response.data.data || response.data
            };
        } catch (error) {
            console.error('Erro ao obter fatores de influência:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter fatores de influência'
            };
        }
    },

    /**
     * Obtém comparação entre períodos
     * @param {string} groupId - ID do grupo
     * @param {string} currentPeriodStart - Data inicial do período atual (YYYY-MM-DD)
     * @param {string} currentPeriodEnd - Data final do período atual (YYYY-MM-DD)
     * @param {string} comparisonType - Tipo de comparação (opcional, default: year_over_year)
     * @param {string} customPeriodStart - Data inicial do período customizado (opcional)
     * @param {string} customPeriodEnd - Data final do período customizado (opcional)
     * @returns {Promise} Dados de comparação
     */
    async getPeriodComparison(groupId, currentPeriodStart, currentPeriodEnd, comparisonType = 'year_over_year', customPeriodStart, customPeriodEnd) {
        try {
            const response = await api.get('/predictive/period-comparison', {
                params: {
                    groupId,
                    currentPeriodStart,
                    currentPeriodEnd,
                    comparisonType,
                    customPeriodStart,
                    customPeriodEnd
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Erro ao obter comparação de períodos:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter comparação de períodos'
            };
        }
    },

    /**
     * Obtém análise completa de volume por grupo com histórico e previsões
     * @param {string} groupId - ID do grupo
     * @param {string} targetDate - Data alvo
     * @param {Object} options - Opções adicionais
     * @returns {Promise} Dados da análise
     */
    async getVolumeAnalysisByGroup(groupId, targetDate, options = {}) {
        try {
            const response = await api.get('/predictive/volume-analysis-group', {
                params: {
                    groupId,
                    targetDate,
                    monthsBack: options.monthsBack || 3,
                    monthsForward: options.monthsForward || 2
                }
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Erro ao obter análise de volume por grupo:', error);
            return {
                success: false,
                error: error.message || 'Erro ao obter análise por grupo'
            };
        }
    }
};

export default predictiveService; 