const DatabaseManager = require('../database/DatabaseManager');

class BaseRepository {
    constructor() {
        this._db = DatabaseManager.getInstance().getDatabase();
        this.initialized = false;
    }

    /**
     * Inicializa o repositório
     */
    async init() {
        // Será sobrescrito por classes filhas para registrar suas tabelas
    }

    /**
     * Executa uma consulta SQL e retorna todas as linhas
     * @param {string} query Consulta SQL
     * @param {Array} params Parâmetros da consulta
     * @returns {Promise<Array>} Linhas retornadas pela consulta
     */
    async query(query, params = []) {
        return new Promise((resolve, reject) => {
            console.log('[BASE-REPOSITORY] Executando query:', query.substring(0, 100) + '...');
            console.log('[BASE-REPOSITORY] Parâmetros:', params);
            console.log('[BASE-REPOSITORY] Database instance existe:', !!this._db);
            
            this._db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('[BASE-REPOSITORY] ❌ Erro na query:', err.message);
                    console.error('[BASE-REPOSITORY] Código do erro:', err.code);
                    console.error('[BASE-REPOSITORY] Query que falhou:', query);
                    reject(err);
                } else {
                    console.log('[BASE-REPOSITORY] ✅ Query executada, linhas retornadas:', (rows || []).length);
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Executa uma consulta SQL e retorna a primeira linha
     * @param {string} query Consulta SQL
     * @param {Array} params Parâmetros da consulta
     * @returns {Promise<Object>} Primeira linha retornada pela consulta
     */
    async queryOne(query, params = []) {
        return new Promise((resolve, reject) => {
            console.log('[BASE-REPOSITORY] Executando queryOne:', query.substring(0, 100) + '...');
            
            this._db.get(query, params, (err, row) => {
                if (err) {
                    console.error('[BASE-REPOSITORY] ❌ Erro no queryOne:', err.message);
                    console.error('[BASE-REPOSITORY] Código do erro:', err.code);
                    reject(err);
                } else {
                    console.log('[BASE-REPOSITORY] ✅ QueryOne executada, resultado:', !!row);
                    resolve(row);
                }
            });
        });
    }

    /**
     * Executa uma consulta SQL sem retorno de dados
     * @param {string} query Consulta SQL
     * @param {Array} params Parâmetros da consulta
     * @returns {Promise<Object>} Resultado da execução
     */
    async execute(query, params = []) {
        return new Promise((resolve, reject) => {
            console.log('[BASE-REPOSITORY] Executando execute:', query.substring(0, 100) + '...');
            
            this._db.run(query, params, function(err) {
                if (err) {
                    console.error('[BASE-REPOSITORY] ❌ Erro no execute:', err.message);
                    console.error('[BASE-REPOSITORY] Código do erro:', err.code);
                    reject(err);
                } else {
                    console.log('[BASE-REPOSITORY] ✅ Execute executado, changes:', this.changes, 'lastID:', this.lastID);
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Executa múltiplas consultas em uma transação
     * @param {Function} callback Função que recebe a transação como parâmetro
     * @returns {Promise<any>} Resultado da transação
     */
    async transaction(callback) {
        return new Promise((resolve, reject) => {
            this._db.serialize(() => {
                this._db.run('BEGIN TRANSACTION');
                
                try {
                    const result = callback(this);
                    this._db.run('COMMIT');
                    resolve(result);
                } catch (error) {
                    this._db.run('ROLLBACK');
                    reject(error);
                }
            });
        });
    }
}

module.exports = BaseRepository; 