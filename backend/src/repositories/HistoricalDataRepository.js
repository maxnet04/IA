const BaseRepository = require('./BaseRepository');
const DatabaseManager = require('../database/DatabaseManager');

class HistoricalDataRepository extends BaseRepository {
    constructor() {
        super();
        this.registerTables();
    }

    registerTables() {
        const dbManager = DatabaseManager.getInstance();
        
        // Registra a tabela historical_data (mantém compatibilidade com produtos)
        dbManager.registerTable(
            'historical_data',
            `
                CREATE TABLE IF NOT EXISTS historical_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT,
                    group_id TEXT,
                    date TEXT NOT NULL,
                    volume INTEGER NOT NULL,
                    category TEXT,
                    priority TEXT,
                    group_name TEXT,
                    resolution_time INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(COALESCE(product_id, '') || COALESCE(group_id, '') || date)
                )
            `
        );
    }

    /**
     * Salva dados históricos para um ou mais produtos/grupos
     * @param {Object|Array} data Objeto ou array de objetos com dados históricos
     * @returns {Promise<Array>} IDs dos registros inseridos
     */
    async saveHistoricalData(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        const query = `
            INSERT OR REPLACE INTO historical_data 
            (product_id, group_id, date, volume, category, priority, group_name, resolution_time, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const promises = data.map(item => {
            return this.execute(
                    query,
                    [
                        item.product_id || null,
                        item.group_id || null,
                        item.date,
                        item.volume,
                        item.category,
                        item.priority,
                        item.group_name,
                        item.resolution_time
                ]
                );
        });

        return Promise.all(promises);
    }

    /**
     * Salva dados históricos para grupos
     * @param {Object|Array} data Objeto ou array de objetos com dados históricos de grupos
     * @returns {Promise<Array>} IDs dos registros inseridos
     */
    async saveGroupHistoricalData(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        const promises = data.map(item => {
            return this.saveHistoricalData({
                group_id: item.group_id,
                date: item.date,
                volume: item.volume,
                category: item.category,
                priority: item.priority,
                group_name: item.group_name,
                resolution_time: item.resolution_time
            });
        });

        return Promise.all(promises);
    }

    /**
     * Obtém dados históricos para um produto
     * @param {string} productId ID do produto
     * @param {string} startDate Data inicial
     * @param {string} endDate Data final
     * @returns {Promise<Array>} Dados históricos
     */
    async getHistoricalData(productId, startDate = null, endDate = null) {
        let query;
        const params = [];

        if (productId === 'ALL') {
            // Para 'ALL', soma os volumes de todos os produtos por data
            query = `
                SELECT 
                    'ALL' as product_id,
                    date,
                    SUM(volume) as volume,
                    GROUP_CONCAT(DISTINCT category) as category,
                    GROUP_CONCAT(DISTINCT priority) as priority,
                    GROUP_CONCAT(DISTINCT group_name) as group_name,
                    AVG(resolution_time) as resolution_time
                FROM historical_data
                WHERE product_id IS NOT NULL
            `;
        } else {
            // Para produtos específicos, mantém o comportamento original
            query = 'SELECT * FROM historical_data WHERE product_id = ?';
            params.push(productId);
        }

        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }

        if (productId === 'ALL') {
            query += ' GROUP BY date';
        }

        query += ' ORDER BY date ASC';

        return this.query(query, params);
    }

    /**
     * Obtém dados históricos para um grupo
     * @param {string} groupId ID do grupo
     * @param {string} startDate Data inicial
     * @param {string} endDate Data final
     * @returns {Promise<Array>} Dados históricos
     */
    async getGroupHistoricalData(groupId, startDate = null, endDate = null) {
        let query;
        const params = [];

        if (groupId === 'ALL') {
            // Para 'ALL', soma os volumes de todos os grupos por data
            query = `
                SELECT 
                    'ALL' as group_id,
                    date,
                    SUM(volume) as volume,
                    GROUP_CONCAT(DISTINCT category) as category,
                    GROUP_CONCAT(DISTINCT priority) as priority,
                    GROUP_CONCAT(DISTINCT group_name) as group_name,
                    AVG(resolution_time) as resolution_time
                FROM historical_data
                WHERE group_id IS NOT NULL
            `;
        } else {
            // Para grupos específicos
            query = 'SELECT * FROM historical_data WHERE group_id = ?';
            params.push(groupId);
        }

        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }

        if (groupId === 'ALL') {
            query += ' GROUP BY date';
        }

        query += ' ORDER BY date ASC';

        return this.query(query, params);
    }

    /**
     * Remove dados históricos de um produto
     * @param {string} productId ID do produto
     * @param {string} startDate Data inicial opcional
     * @param {string} endDate Data final opcional
     * @returns {Promise<number>} Número de registros removidos
     */
    async deleteHistoricalData(productId, startDate = null, endDate = null) {
        let query = 'DELETE FROM historical_data WHERE product_id = ?';
        const params = [productId];

        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }

        const result = await this.execute(query, params);
        return result.changes;
    }

    /**
     * Obtém a data mais recente com dados para um produto
     * @param {string} productId ID do produto
     * @returns {Promise<string>} Data mais recente
     */
    async getLatestDate(productId) {
        const query = `
            SELECT MAX(date) as latest_date 
            FROM historical_data 
            WHERE product_id = ?
        `;

        const row = await this.queryOne(query, [productId]);
        return row?.latest_date;
    }

    /**
     * Obtém o intervalo de datas com dados para um produto
     * @param {string} productId ID do produto
     * @returns {Promise<Object>} Objeto com datas mínima e máxima
     */
    async getDateRange(productId) {
        const query = `
            SELECT MIN(date) as min_date, MAX(date) as max_date 
            FROM historical_data 
            WHERE product_id = ?
        `;

        const row = await this.queryOne(query, [productId]);
        return {
                    minDate: row?.min_date,
                    maxDate: row?.max_date
        };
    }

    /**
     * Obtém métricas agregadas para um produto em um período
     * @param {string} productId ID do produto
     * @param {string} startDate Data inicial
     * @param {string} endDate Data final
     * @returns {Promise<Object>} Métricas agregadas
     */
    async getAggregatedMetrics(productId, startDate, endDate) {
        const query = `
            SELECT 
                COUNT(*) as total_records,
                AVG(volume) as avg_volume,
                MAX(volume) as max_volume,
                MIN(volume) as min_volume,
                AVG(resolution_time) as avg_resolution_time,
                COUNT(DISTINCT category) as unique_categories,
                COUNT(DISTINCT group_name) as unique_groups
            FROM historical_data
            WHERE product_id = ?
            AND date BETWEEN ? AND ?
        `;

        const row = await this.queryOne(query, [productId, startDate, endDate]);
        
        if (!row || row.total_records === 0) {
            return {
                        total_records: 0,
                        avg_volume: null,
                        max_volume: null,
                        min_volume: null,
                        avg_resolution_time: null,
                        unique_categories: 0,
                        unique_groups: 0
            };
        }
        
        return row;
                }

    /**
     * Obtém lista de todos os produtos disponíveis
     * @returns {Promise<Array>} Lista de IDs de produtos
     */
    async getAllProducts() {
        return this.query(
            `SELECT DISTINCT product_id FROM historical_data WHERE product_id != 'ALL'`
        ).then(rows => rows.map(row => row.product_id));
    }

    /**
     * Obtém histórico de volume para um produto específico
     * @param {string} productId ID do produto
     * @param {string} targetDate Data alvo
     * @param {number} monthsBack Número de meses para trás
     * @returns {Promise<Array>} Array com histórico de volumes
     */
    async getVolumeHistory(productId, targetDate, monthsBack) {
        const startDate = new Date(targetDate);
        startDate.setMonth(startDate.getMonth() - monthsBack);
        const startDateStr = startDate.toISOString().split('T')[0];

        let query;
        const params = [];

        if (productId === 'ALL') {
            query = `
                SELECT 
                    'ALL' as product_id,
                    date,
                    SUM(volume) as volume
                FROM historical_data
                WHERE date BETWEEN ? AND ?
                GROUP BY date
                ORDER BY date ASC
            `;
            params.push(startDateStr, targetDate);
        } else {
            query = `
                SELECT 
                    product_id,
                    date,
                    volume
                FROM historical_data
                WHERE product_id = ?
                AND date BETWEEN ? AND ?
                ORDER BY date ASC
            `;
            params.push(productId, startDateStr, targetDate);
        }

        try {
            return await this.query(query, params);
        } catch (err) {
                    console.error('Erro ao buscar histórico de volume:', err);
            throw err;
                }
    }

    /**
     * Obtém histórico de volume agregado de todos os produtos
     * @param {string} targetDate Data alvo
     * @param {number} monthsBack Número de meses para trás
     * @returns {Promise<Array>} Array com histórico de volumes agregados
     */
    async getAggregatedVolumeHistory(targetDate, monthsBack) {
        const query = `
                SELECT 
                    date,
                    SUM(volume) as volume
            FROM historical_data
                WHERE date <= ?
                GROUP BY date
                ORDER BY date DESC
                LIMIT ?
        `;
        
        return this.query(query, [targetDate, monthsBack]);
    }

    /**
     * Importa dados históricos em lote
     * @param {Array} dataArray Array de objetos com dados históricos
     * @returns {Promise<Object>} Resultado da importação
     */
    async bulkImport(dataArray) {
        return this.transaction(async (repo) => {
            const results = {
                total: dataArray.length,
                inserted: 0,
                errors: []
            };

            for (let i = 0; i < dataArray.length; i++) {
                try {
                    await this.saveHistoricalData(dataArray[i]);
                    results.inserted++;
                } catch (error) {
                    results.errors.push({
                        index: i,
                        item: dataArray[i],
                        error: error.message
                    });
                }
            }

            return results;
            });
    }

    /**
     * Obtém dados históricos agregados por categoria
     * @param {string} productId ID do produto
     * @param {string} startDate Data inicial
     * @param {string} endDate Data final
     * @returns {Promise<Array>} Dados agregados por categoria
     */
    async getDataByCategory(productId, startDate, endDate) {
        const query = `
            SELECT 
                category,
                SUM(volume) as total_volume,
                COUNT(*) as count,
                AVG(volume) as avg_volume
            FROM historical_data
            WHERE product_id = ?
            AND date BETWEEN ? AND ?
            GROUP BY category
            ORDER BY total_volume DESC
        `;

        return this.query(query, [productId, startDate, endDate]);
    }
}

module.exports = HistoricalDataRepository; 