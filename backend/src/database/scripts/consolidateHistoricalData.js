const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

function getMostFrequent(arr) {
    if (!arr.length) return null;
    const freq = {};
    arr.forEach(val => { freq[val] = (freq[val] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function getAvg(arr) {
    if (!arr.length) return null;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

async function consolidate() {
    // Buscar todos os produtos
    db.all('SELECT DISTINCT product_id FROM incidents', [], (err, products) => {
        if (err) throw err;
        products.forEach(({ product_id }) => {
            // Buscar todas as datas para o produto
            db.all('SELECT DISTINCT incident_date FROM incidents WHERE product_id = ?', [product_id], (err, dates) => {
                if (err) throw err;
                dates.forEach(({ incident_date }) => {
                    // Verificar se já existe registro em historical_data
                    db.get('SELECT 1 FROM historical_data WHERE product_id = ? AND date = ?', [product_id, incident_date], (err, row) => {
                        if (err) throw err;
                        if (row) return; // Já existe, pular
                        // Buscar todos os incidentes desse produto/data
                        db.all('SELECT * FROM incidents WHERE product_id = ? AND incident_date = ?', [product_id, incident_date], (err, incidents) => {
                            if (err) throw err;
                            if (!incidents.length) return;
                            // Agregações
                            const volume = incidents.length;
                            const categories = incidents.map(i => i.CATEGORIA);
                            const priorities = incidents.map(i => i.PRIORIDADE);
                            const groups = incidents.map(i => i.GRUPO_DIRECIONADO);
                            // Tempo de resolução: diferença DATA_CRIACAO - DATA_ENCERRAMENTO (em minutos)
                            const resolutionTimes = incidents
                                .filter(i => i.DATA_CRIACAO && i.DATA_ENCERRAMENTO)
                                .map(i => (new Date(i.DATA_ENCERRAMENTO) - new Date(i.DATA_CRIACAO)) / 60000)
                                .filter(x => !isNaN(x));
                            db.run(
                                `INSERT INTO historical_data (product_id, date, volume, category, priority, group_name, resolution_time, created_at, updated_at)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                                [
                                    product_id,
                                    incident_date,
                                    volume,
                                    getMostFrequent(categories),
                                    getMostFrequent(priorities),
                                    getMostFrequent(groups),
                                    getAvg(resolutionTimes)
                                ]
                            );
                        });
                    });
                });
            });
        });
    });
}

consolidate();
db.close(); 