import api from './axiosConfig';

const notificationService = {
    /**
     * Obtém notificações de anomalias críticas
     * @param {string} productId - ID do produto (opcional)
     * @returns {Promise} Lista de notificações
     */
    async getCriticalAnomalies(productId) {
        try {
            const response = await api.get('/predictive/anomalies', {
                params: { 
                    productId, 
                    severity: 'alta',
                    limit: 5
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao obter notificações:', error);
            throw error;
        }
    },

    /**
     * Marca uma notificação como lida
     * @param {string} notificationId - ID da notificação
     * @returns {Promise} Resultado da operação
     */
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/predictive/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            throw error;
        }
    },

    /**
     * Obtém histórico de previsões
     * @param {string} productId - ID do produto
     * @param {string} startDate - Data inicial
     * @param {string} endDate - Data final
     * @returns {Promise} Histórico de previsões
     */
    async getPredictionHistory(productId, startDate, endDate) {
        try {
            const response = await api.get('/predictive/history', {
                params: { 
                    productId, 
                    startDate, 
                    endDate 
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao obter histórico de previsões:', error);
            throw error;
        }
    }
};

export default notificationService; 