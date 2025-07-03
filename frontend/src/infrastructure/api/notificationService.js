import api from './axiosConfig';

const notificationService = {
    /**
     * Obtém notificações de um grupo
     * @param {string} groupId - ID do grupo (opcional, padrão: 'ALL')
     * @param {Object} options - Opções de filtro
     * @returns {Promise} Lista de notificações
     */
    async getNotifications(groupId = 'ALL', options = {}) {
        try {
            const response = await api.get('/predictive/notifications', {
                params: { 
                    groupId,
                    ...options
                }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error('Erro ao obter notificações:', error);
            throw error;
        }
    },

    /**
     * Marca todas as notificações de um grupo como lidas
     * @param {string} groupId - ID do grupo
     * @returns {Promise} Resultado da operação
     */
    async markAllAsRead(groupId = 'ALL') {
        try {
            const response = await api.put('/predictive/notifications/mark-all-read', {}, {
                params: { groupId }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
            throw error;
        }
    },

    /**
     * Obtém notificações de anomalias críticas
     * @param {string} groupId - ID do grupo (opcional)
     * @returns {Promise} Lista de notificações
     */
    async getCriticalAnomalies(groupId) {
        try {
            const response = await api.get('/predictive/anomalies', {
                params: { 
                    groupId, 
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