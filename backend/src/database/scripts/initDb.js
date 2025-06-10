const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ajustar o caminho para apontar corretamente para a pasta data
const dbPath = path.resolve(__dirname, '../../../data/database.sqlite');
const dataDir = path.dirname(dbPath);

// Certificar-se de que a pasta data existe
if (!fs.existsSync(dataDir)) {
    console.log(`Criando diretório de dados em: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`Inicializando banco de dados em: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

// Iniciar a criação de todas as tabelas
db.serialize(() => {
    console.log('Criando tabelas...');

    // Criar tabela incidents
    db.run(`
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            incident_date TEXT NOT NULL,
            DATA_CRIACAO TEXT NOT NULL,
            DATA_ENCERRAMENTO TEXT,
            CATEGORIA TEXT,
            GRUPO_ATUAL TEXT,
            GRUPO_DIRECIONADO TEXT,
            PRIORIDADE TEXT,
            PROBLEMA TEXT,
            SOLUCAO TEXT,
            USU_TRATAMENTO TEXT,
            ANALISE TEXT,
            ACAO TEXT,
            volume INTEGER NOT NULL,
            is_anomaly INTEGER DEFAULT 0,
            anomaly_type TEXT
        )
    `);

    // Criar tabela historical_data
    db.run(`
        CREATE TABLE IF NOT EXISTS historical_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            date TEXT NOT NULL,
            volume INTEGER NOT NULL,
            category TEXT,
            priority TEXT,
            group_name TEXT,
            resolution_time INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_id, date)
        )
    `);

    // Criar tabela users
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);

    // Criar tabela notifications
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            severity TEXT NOT NULL,
            related_entity TEXT,
            related_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            read_at DATETIME,
            UNIQUE(product_id, message, created_at)
        )
    `);

    console.log('Banco de dados inicializado com sucesso!');
    db.close();
}); 