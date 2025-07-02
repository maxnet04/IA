const BaseRepository = require('./BaseRepository');
const DatabaseManager = require('../database/DatabaseManager');

class NotificationRepository extends BaseRepository {
    constructor() {
        super();
        this.registerTables();
    }

    registerTables() {
        const dbManager = DatabaseManager.getInstance();
        
        // Registra a tabela notifications conforme estrutura original
        dbManager.registerTable(
            'notifications',
            `
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL,
                severity TEXT NOT NULL,
                related_entity TEXT,
                related_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME,
                UNIQUE(group_id, message, created_at)
            )
            `
        );
    }

    /**
     * Cria uma nova notificação
     * @param {Object} notification Dados da notificação
     * @returns {Promise<Object>} Notificação criada
     */
    async createNotification(notification) {
        const query = `
            INSERT INTO notifications 
            (group_id, message, type, severity, related_entity, related_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await this.execute(
            query,
            [
                notification.group_id,
                notification.message,
                notification.type,
                notification.severity,
                notification.related_entity || null,
                notification.related_id || null
            ]
        );
        
        return { id: result.lastID, ...notification };
    }

    /**
     * Marca uma notificação como lida
     * @param {number} notificationId ID da notificação
     * @returns {Promise<Object>} Resultado da operação
     */
    async markNotificationAsRead(notificationId) {
        const query = `
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const result = await this.execute(query, [notificationId]);
        return { id: notificationId, updated: result.changes > 0 };
    }

    /**
     * Marca todas as notificações de um grupo como lidas
     * @param {string} groupId ID do grupo
     * @returns {Promise<number>} Número de notificações atualizadas
     */
    async markAllAsRead(groupId) {
        const query = `
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE group_id = ? AND read_at IS NULL
        `;
        
        const result = await this.execute(query, [groupId]);
        return result.changes;
    }

    /**
     * Busca todas as notificações de um grupo
     * @param {string} groupId ID do grupo
     * @param {Object} options Opções de filtragem
     * @returns {Promise<Array>} Lista de notificações
     */
    async getNotifications(groupId, options = {}) {
        const { 
            unreadOnly = false, 
            limit = 50, 
            offset = 0,
            types = [],
            severities = []
        } = options;
        
        let query = `
            SELECT *
            FROM notifications
            WHERE group_id = ?
        `;
        
        const params = [groupId];
        
        if (unreadOnly) {
            query += ' AND read_at IS NULL';
        }
        
        if (types.length > 0) {
            query += ` AND type IN (${types.map(() => '?').join(', ')})`;
            params.push(...types);
        }
        
        if (severities.length > 0) {
            query += ` AND severity IN (${severities.map(() => '?').join(', ')})`;
            params.push(...severities);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return this.query(query, params);
    }

    /**
     * Obtém contagem de notificações não lidas
     * @param {string} groupId ID do grupo
     * @returns {Promise<number>} Número de notificações não lidas
     */
    async getUnreadCount(groupId) {
        const query = `
            SELECT COUNT(*) as count
            FROM notifications
            WHERE group_id = ? AND read_at IS NULL
        `;
        
        const result = await this.queryOne(query, [groupId]);
        return result.count;
    }

    /**
     * Remove uma notificação
     * @param {number} notificationId ID da notificação
     * @returns {Promise<boolean>} True se removido com sucesso
     */
    async deleteNotification(notificationId) {
        const query = `
            DELETE FROM notifications
            WHERE id = ?
        `;
        
        const result = await this.execute(query, [notificationId]);
        return result.changes > 0;
    }

    /**
     * Remove notificações antigas
     * @param {number} days Número de dias para manter
     * @returns {Promise<number>} Número de notificações removidas
     */
    async cleanupOldNotifications(days = 30) {
        const query = `
            DELETE FROM notifications
            WHERE read_at IS NOT NULL
            AND created_at < datetime('now', '-' || ? || ' days')
        `;
        
        const result = await this.execute(query, [days]);
        return result.changes;
    }

    /**
     * Cria múltiplas notificações de uma vez
     * @param {Array} notifications Array de notificações
     * @returns {Promise<Array>} Notificações criadas
     */
    async createBulkNotifications(notifications) {
        const promises = notifications.map(notification => this.createNotification(notification));
        return Promise.all(promises);
    }

    /**
     * Busca uma notificação por ID
     * @param {number} id ID da notificação
     * @returns {Promise<Object>} Notificação
     */
    async getNotificationById(id) {
        const query = `
            SELECT *
            FROM notifications
            WHERE id = ?
        `;
        
        return this.queryOne(query, [id]);
    }

    /**
     * Busca as últimas notificações de todos os grupos
     * @param {number} limit Limite de notificações por grupo
     * @returns {Promise<Array>} Lista de notificações agrupadas por grupo
     */
    async getLatestNotifications(limit = 5) {
        const query = `
            SELECT *
            FROM notifications
            WHERE group_id IN (
                SELECT DISTINCT group_id FROM notifications
            )
            AND (group_id, created_at) IN (
                SELECT group_id, MAX(created_at)
                FROM notifications
                GROUP BY group_id
            )
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        return this.query(query, [limit]);
    }
}

module.exports = NotificationRepository; 