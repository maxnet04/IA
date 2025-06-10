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
            this._db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
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
            this._db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
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
            this._db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
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