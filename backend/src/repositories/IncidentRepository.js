const BaseRepository = require('./BaseRepository');
const DatabaseManager = require('../database/DatabaseManager');

class IncidentRepository extends BaseRepository {
    constructor() {
        super();
        this.registerTables();
    }

    registerTables() {
        const dbManager = DatabaseManager.getInstance();
        
        // Registra a tabela incidents com a estrutura otimizada
        dbManager.registerTable(
            'incidents',
            `
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                INCIDENTE TEXT NOT NULL,
                CATEGORIA TEXT NOT NULL,
                GRUPO_DIRECIONADO TEXT,
                DATA_CRIACAO DATETIME NOT NULL,
                PRIORIDADE TEXT NOT NULL,
                DATA_ENCERRAMENTO DATETIME,
                ACAO TEXT CHECK(ACAO IN ('CANCELADO', 'RESOLVIDO', 'DIRECIONADO'))
            )
            `
        );
    }

    /**
     * Cria um novo incidente
     * @param {Object} incident Dados do incidente
     * @returns {Promise<Object>} Incidente criado
     */
    async createIncident(incident) {
        const query = `
            INSERT INTO incidents 
            (INCIDENTE, CATEGORIA, GRUPO_DIRECIONADO, DATA_CRIACAO, PRIORIDADE)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await this.execute(
            query, 
            [
                incident.incidente,
                incident.categoria,
                incident.grupoDirecionado || null,
                incident.dataCriacao || new Date().toISOString(),
                incident.prioridade
            ]
        );
        
        return this.getIncidentById(result.lastID);
    }

    /**
     * Obtém um incidente pelo ID
     * @param {number} id ID do incidente
     * @returns {Promise<Object>} Incidente
     */
    async getIncidentById(id) {
        const query = `
            SELECT * FROM incidents WHERE id = ?
        `;
        
        return this.queryOne(query, [id]);
    }

    /**
     * Atualiza um incidente
     * @param {number} id ID do incidente
     * @param {Object} incidentData Dados do incidente a serem atualizados
     * @returns {Promise<Object>} Incidente atualizado
     */
    async updateIncident(id, incidentData) {
        const updateFields = [];
        const params = [];
        
        const fieldMapping = {
            incidente: 'INCIDENTE',
            categoria: 'CATEGORIA',
            grupoDirecionado: 'GRUPO_DIRECIONADO',
            prioridade: 'PRIORIDADE',
            acao: 'ACAO'
        };
        
        for (const [key, value] of Object.entries(incidentData)) {
            const dbField = fieldMapping[key];
            if (dbField && key !== 'id' && key !== 'dataCriacao') {
                updateFields.push(`${dbField} = ?`);
                params.push(value);
            }
        }
        
        // Se tiver uma ação de encerramento, atualiza a data
        if (incidentData.acao === 'RESOLVIDO' || incidentData.acao === 'CANCELADO') {
            updateFields.push('DATA_ENCERRAMENTO = ?');
            params.push(new Date().toISOString());
        }
        
        if (updateFields.length === 0) {
            return this.getIncidentById(id);
        }
        
        params.push(id);
        
        const query = `
            UPDATE incidents 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
        `;
        
        await this.execute(query, params);
        return this.getIncidentById(id);
    }

    /**
     * Remove um incidente
     * @param {number} id ID do incidente
     * @returns {Promise<boolean>} True se removido com sucesso
     */
    async deleteIncident(id) {
        const query = 'DELETE FROM incidents WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.changes > 0;
    }

    /**
     * Lista incidentes com opções de filtro
     * @param {Object} options Opções de filtragem
     * @returns {Promise<Object>} Lista de incidentes com paginação
     */
    async listIncidents(options = {}) {
        const {
            page = 1,
            limit = 20,
            startDate,
            endDate,
            grupos = [],
            acoes = [],
            categoria,
            prioridade,
            search
        } = options;
        
        const offset = (page - 1) * limit;
        const whereConditions = [];
        const params = [];
        
        if (startDate && endDate) {
            whereConditions.push('DATA_CRIACAO BETWEEN ? AND ?');
            params.push(startDate, endDate);
        } else if (startDate) {
            whereConditions.push('DATA_CRIACAO >= ?');
            params.push(startDate);
        } else if (endDate) {
            whereConditions.push('DATA_CRIACAO <= ?');
            params.push(endDate);
        }
        
        if (grupos && grupos.length > 0) {
            whereConditions.push(`GRUPO_DIRECIONADO IN (${grupos.map(() => '?').join(', ')})`);
            params.push(...grupos);
        }
        
        if (acoes && acoes.length > 0) {
            whereConditions.push(`ACAO IN (${acoes.map(() => '?').join(', ')})`);
            params.push(...acoes);
        }
        
        if (categoria) {
            whereConditions.push('CATEGORIA = ?');
            params.push(categoria);
        }
        
        if (prioridade) {
            whereConditions.push('PRIORIDADE = ?');
            params.push(prioridade);
        }
        
        if (search) {
            whereConditions.push('INCIDENTE LIKE ?');
            params.push(`%${search}%`);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        const query = `
            SELECT * FROM incidents
            ${whereClause}
            ORDER BY DATA_CRIACAO DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM incidents
            ${whereClause}
        `;
        
        const [incidents, countResult] = await Promise.all([
            this.query(query, params),
            this.queryOne(countQuery, params.slice(0, -2))
        ]);
        
        return {
            incidents,
            pagination: {
                total: countResult.total,
                page,
                limit,
                pages: Math.ceil(countResult.total / limit)
            }
        };
    }

    /**
     * Obtém estatísticas de incidentes
     * @param {Array} grupos Grupos para filtrar
     * @param {Array} acoes Ações para filtrar
     * @returns {Promise<Object>} Estatísticas
     */
    async getStatistics(grupos = [], acoes = []) {
        const whereConditions = [];
        const params = [];
        
        if (grupos && grupos.length > 0) {
            whereConditions.push(`GRUPO_DIRECIONADO IN (${grupos.map(() => '?').join(', ')})`);
            params.push(...grupos);
        }
        
        if (acoes && acoes.length > 0) {
            whereConditions.push(`ACAO IN (${acoes.map(() => '?').join(', ')})`);
            params.push(...acoes);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
            
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN DATA_ENCERRAMENTO IS NULL THEN 1 END) as ativos,
                COUNT(CASE WHEN DATA_ENCERRAMENTO IS NOT NULL THEN 1 END) as resolvidos,
                ROUND(AVG(CASE 
                    WHEN DATA_ENCERRAMENTO IS NOT NULL 
                    THEN (julianday(DATA_ENCERRAMENTO) - julianday(DATA_CRIACAO)) * 24 * 60 
                    END)) as tempoMedioResolucao,
                COUNT(CASE WHEN ACAO = 'RESOLVIDO' THEN 1 END) as totalResolvidos,
                COUNT(CASE WHEN ACAO = 'DIRECIONADO' THEN 1 END) as totalDirecionados,
                COUNT(CASE WHEN ACAO = 'CANCELADO' THEN 1 END) as totalCancelados
            FROM incidents ${whereClause}
        `;
        
        const result = await this.queryOne(query, params);
        
        return {
            total: result.total,
            ativos: result.ativos,
            resolvidos: result.resolvidos,
            tempoMedioResolucao: result.tempoMedioResolucao || 0,
            acoes: {
                resolvidos: result.totalResolvidos || 0,
                direcionados: result.totalDirecionados || 0,
                cancelados: result.totalCancelados || 0
            }
        };
    }

    /**
     * Obtém estatísticas de incidentes por grupo
     * @param {string} startDate Data inicial
     * @param {string} endDate Data final
     * @param {Array} grupos Grupos para filtrar
     * @param {Array} acoes Ações para filtrar
     * @returns {Promise<Array>} Estatísticas por grupo
     */
    async getIncidentesPorGrupo(startDate, endDate, grupos = [], acoes = []) {
        const whereConditions = [];
        const params = [];
        
        if (startDate && endDate) {
            whereConditions.push('DATA_CRIACAO BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }
        
        if (grupos && grupos.length > 0) {
            whereConditions.push(`GRUPO_DIRECIONADO IN (${grupos.map(() => '?').join(', ')})`);
            params.push(...grupos);
        }
        
        if (acoes && acoes.length > 0) {
            whereConditions.push(`ACAO IN (${acoes.map(() => '?').join(', ')})`);
            params.push(...acoes);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
            
        const query = `
            SELECT 
                GRUPO_DIRECIONADO,
                COUNT(*) as total,
                COUNT(CASE WHEN ACAO = 'RESOLVIDO' THEN 1 END) as resolvidos,
                ROUND(AVG(CASE 
                    WHEN DATA_ENCERRAMENTO IS NOT NULL 
                    THEN (julianday(DATA_ENCERRAMENTO) - julianday(DATA_CRIACAO)) * 24 * 60 
                    END)) as tempoMedioResolucao
            FROM incidents
            ${whereClause} 
            ${whereClause ? 'AND' : 'WHERE'} GRUPO_DIRECIONADO IS NOT NULL
            GROUP BY GRUPO_DIRECIONADO
        `;
        
        return this.query(query, params);
    }

    /**
     * Busca incidentes por intervalo de datas
     * @param {Date} startDate Data inicial
     * @param {Date} endDate Data final
     * @param {Array} grupos Grupos para filtrar
     * @param {Array} acoes Ações para filtrar
     * @returns {Promise<Array>} Lista de incidentes
     */
    async findByDateRange(startDate, endDate, grupos = [], acoes = []) {
        const whereConditions = [];
        const params = [];
        
        // Converter datas para formato ISO string
        const formattedStartDate = startDate instanceof Date ? startDate.toISOString() : startDate;
        const formattedEndDate = endDate instanceof Date ? endDate.toISOString() : endDate;
        
        if (formattedStartDate && formattedEndDate) {
            whereConditions.push('DATA_CRIACAO BETWEEN ? AND ?');
            params.push(formattedStartDate, formattedEndDate);
        } else if (formattedStartDate) {
            whereConditions.push('DATA_CRIACAO >= ?');
            params.push(formattedStartDate);
        } else if (formattedEndDate) {
            whereConditions.push('DATA_CRIACAO <= ?');
            params.push(formattedEndDate);
        }
        
        if (grupos && grupos.length > 0) {
            whereConditions.push(`GRUPO_DIRECIONADO IN (${grupos.map(() => '?').join(', ')})`);
            params.push(...grupos);
        }
        
        if (acoes && acoes.length > 0) {
            whereConditions.push(`ACAO IN (${acoes.map(() => '?').join(', ')})`);
            params.push(...acoes);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        const query = `
            SELECT * FROM incidents
            ${whereClause}
            ORDER BY DATA_CRIACAO ASC
        `;
        
        return this.query(query, params);
    }
}

module.exports = IncidentRepository; 