const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { getConnection, dbPath } = require('../config/database');

class DatabaseManager {
    constructor() {
        this._tableDefinitions = [];
        this._isInitialized = false;
        this._db = null;
    }

    static getInstance() {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager();
        }
        return DatabaseManager._instance;
    }

    registerTable(name, createTableSql, verificationCallback = null) {
        this._tableDefinitions.push({
            name,
            createTableSql,
            verificationCallback
        });
        return this;
    }

    getDatabase() {
        if (!this._db) {
            console.log('[DATABASE-MANAGER] === OBTENDO CONEXÃO ===');
            console.log('[DATABASE-MANAGER] Modo PKG:', process.pkg !== undefined);
            console.log('[DATABASE-MANAGER] NODE_ENV:', process.env.NODE_ENV);
            
            if (process.env.NODE_ENV === 'test') {
                console.log('[DATABASE-MANAGER] Usando banco em memória para testes');
                this._db = new sqlite3.Database(':memory:');
            } else {
                console.log('[DATABASE-MANAGER] Criando conexão direta...');
                this._createDirectConnection();
            }
        }
        return this._db;
    }

    _createDirectConnection() {
        const isPkg = process.pkg !== undefined;
        console.log('[DATABASE-MANAGER] Modo PKG detectado:', isPkg);
        
        let finalDbPath;
        
        if (isPkg) {
            console.log('[DATABASE-MANAGER] ✅ Usando caminho do database-wrapper para PKG');
            finalDbPath = dbPath; // Usa o caminho do wrapper (temporário)
            console.log('[DATABASE-MANAGER] Caminho do wrapper:', finalDbPath);
        } else {
            console.log('[DATABASE-MANAGER] Usando caminho normal para desenvolvimento');
            finalDbPath = path.join(__dirname, '../../data/database.sqlite');
            const dataDir = path.dirname(finalDbPath);
            if (!fs.existsSync(dataDir)) {
                console.log('[DATABASE-MANAGER] Criando diretório:', dataDir);
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }
        
        console.log('[DATABASE-MANAGER] Caminho final do banco:', finalDbPath);
        console.log('[DATABASE-MANAGER] Arquivo existe:', fs.existsSync(finalDbPath));
        
        if (fs.existsSync(finalDbPath)) {
            const stats = fs.statSync(finalDbPath);
            console.log('[DATABASE-MANAGER] Tamanho do arquivo:', stats.size, 'bytes');
        }
        
        console.log('[DATABASE-MANAGER] Criando instância SQLite...');
        this._db = new sqlite3.Database(finalDbPath, (err) => {
            if (err) {
                console.error('[DATABASE-MANAGER] ❌ Erro na conexão DatabaseManager:', err.message);
                console.error('[DATABASE-MANAGER] Código do erro:', err.code);
            } else {
                console.log('[DATABASE-MANAGER] ✅ DatabaseManager conectado com sucesso!');
            }
        });
    }

    async init() {
        if (this._isInitialized) {
            return;
        }

        try {
            for (const tableDef of this._tableDefinitions) {
                await this._createTable(tableDef.name, tableDef.createTableSql);
                
                if (tableDef.verificationCallback) {
                    await this._verifyTable(tableDef.name, tableDef.verificationCallback);
                }
            }
            
            this._isInitialized = true;
            console.log('Banco de dados inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            throw error;
        }
    }

    async _createTable(tableName, sql) {
        return new Promise((resolve, reject) => {
            this.getDatabase().run(sql, (err) => {
                if (err) {
                    console.error(`Erro ao criar tabela ${tableName}:`, err);
                    reject(err);
                } else {
                    console.log(`Tabela ${tableName} criada com sucesso`);
                    resolve();
                }
            });
        });
    }

    async _verifyTable(tableName, callback = null) {
        return new Promise((resolve, reject) => {
            this.getDatabase().get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [tableName],
                async (err, row) => {
                    if (err) {
                        console.error(`Erro ao verificar tabela ${tableName}:`, err);
                        reject(err);
                    } else if (!row) {
                        console.error(`Tabela ${tableName} não foi criada`);
                        reject(new Error(`Tabela ${tableName} não foi criada`));
                    } else {
                        if (callback) {
                            try {
                                await callback(this.getDatabase());
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            resolve();
                        }
                    }
                }
            );
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this._db) {
                this._db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco de dados:', err);
                        reject(err);
                    } else {
                        this._db = null;
                        this._isInitialized = false;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Singleton instance
DatabaseManager._instance = null;

module.exports = DatabaseManager; 