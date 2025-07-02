const BaseRepository = require('./BaseRepository');

class GroupRepository extends BaseRepository {
    constructor() {
        super();
    }

    async getAllGroups() {
        const query = `
            SELECT DISTINCT 
                GRUPO_DIRECIONADO as group_id,
                GRUPO_DIRECIONADO as group_name,
                COUNT(*) as total_incidents
            FROM incidents 
            WHERE GRUPO_DIRECIONADO IS NOT NULL 
            GROUP BY GRUPO_DIRECIONADO
            ORDER BY total_incidents DESC
        `;
        return this.query(query);
    }

    async getGroupDetails(groupId) {
        const query = `
            SELECT 
                GRUPO_DIRECIONADO as group_id,
                GRUPO_DIRECIONADO as group_name,
                COUNT(*) as total_incidents
            FROM incidents 
            WHERE GRUPO_DIRECIONADO = ?
            GROUP BY GRUPO_DIRECIONADO
        `;
        return this.queryOne(query, [groupId]);
    }

    async getHistoricalData(groupId, startDate = null, endDate = null) {
        let query;
        const params = [];

        if (groupId === 'ALL') {
            query = `
                SELECT 
                    'ALL' as group_id,
                    DATE(DATA_CRIACAO) as date,
                    COUNT(*) as volume
                FROM incidents
                WHERE 1=1
            `;
        } else {
            query = `
                SELECT 
                    GRUPO_DIRECIONADO as group_id,
                    DATE(DATA_CRIACAO) as date,
                    COUNT(*) as volume
                FROM incidents 
                WHERE GRUPO_DIRECIONADO = ?
            `;
            params.push(groupId);
        }

        if (startDate) {
            query += ' AND DATE(DATA_CRIACAO) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(DATA_CRIACAO) <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY DATE(DATA_CRIACAO) ORDER BY date ASC';
        return this.query(query, params);
    }

    async getVolumeHistory(groupId, targetDate, monthsBack) {
        const startDate = new Date(targetDate);
        startDate.setMonth(startDate.getMonth() - monthsBack);
        const startDateStr = startDate.toISOString().split('T')[0];

        let query;
        let params = [];
        if (groupId === 'ALL') {
            query = `
                SELECT 
                    'ALL' as group_id,
                    DATE(DATA_CRIACAO) as date,
                    COUNT(*) as volume
                FROM incidents
                WHERE DATE(DATA_CRIACAO) BETWEEN ? AND ?
                GROUP BY DATE(DATA_CRIACAO)
                ORDER BY date ASC
            `;
            params = [startDateStr, targetDate];
        } else {
            query = `
                SELECT 
                    GRUPO_DIRECIONADO as group_id,
                    DATE(DATA_CRIACAO) as date,
                    COUNT(*) as volume
                FROM incidents
                WHERE GRUPO_DIRECIONADO = ?
                AND DATE(DATA_CRIACAO) BETWEEN ? AND ?
                GROUP BY DATE(DATA_CRIACAO)
                ORDER BY date ASC
            `;
            params = [groupId, startDateStr, targetDate];
        }
        return this.query(query, params);
    }

    async getAggregatedMetrics(groupId, startDate, endDate) {
        let query;
        let params = [];
        if (groupId === 'ALL') {
            query = `
                SELECT 
                    COUNT(*) as total_records,
                    AVG(volume) as avg_volume,
                    MAX(volume) as max_volume,
                    MIN(volume) as min_volume
                FROM (
                    SELECT 
                        DATE(DATA_CRIACAO) as date,
                        COUNT(*) as volume
                    FROM incidents
                    WHERE DATE(DATA_CRIACAO) BETWEEN ? AND ?
                    GROUP BY DATE(DATA_CRIACAO)
                ) daily_volume
            `;
            params = [startDate, endDate];
        } else {
            query = `
                SELECT 
                    COUNT(*) as total_records,
                    AVG(volume) as avg_volume,
                    MAX(volume) as max_volume,
                    MIN(volume) as min_volume
                FROM (
                    SELECT 
                        DATE(DATA_CRIACAO) as date,
                        COUNT(*) as volume
                    FROM incidents
                    WHERE GRUPO_DIRECIONADO = ?
                    AND DATE(DATA_CRIACAO) BETWEEN ? AND ?
                    GROUP BY DATE(DATA_CRIACAO)
                ) daily_volume
            `;
            params = [groupId, startDate, endDate];
        }
        const row = await this.queryOne(query, params);
        return row || { total_records: 0, avg_volume: null, max_volume: null, min_volume: null };
    }

    async getDataByCategory(groupId, startDate, endDate) {
        let query;
        let params = [];
        if (groupId === 'ALL') {
            query = `
                SELECT 
                    CATEGORIA as category,
                    COUNT(*) as total_volume
                FROM incidents
                WHERE DATE(DATA_CRIACAO) BETWEEN ? AND ?
                GROUP BY CATEGORIA
                ORDER BY total_volume DESC
            `;
            params = [startDate, endDate];
        } else {
            query = `
                SELECT 
                    CATEGORIA as category,
                    COUNT(*) as total_volume
                FROM incidents
                WHERE GRUPO_DIRECIONADO = ?
                AND DATE(DATA_CRIACAO) BETWEEN ? AND ?
                GROUP BY CATEGORIA
                ORDER BY total_volume DESC
            `;
            params = [groupId, startDate, endDate];
        }
        return this.query(query, params);
    }
}

module.exports = GroupRepository;
 