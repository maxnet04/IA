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
    // Buscar todos os grupos direcionados distintos
    db.all('SELECT DISTINCT GRUPO_DIRECIONADO FROM incidents WHERE GRUPO_DIRECIONADO IS NOT NULL', [], (err, groups) => {
        if (err) throw err;
        groups.forEach(({ GRUPO_DIRECIONADO }) => {
            // Buscar todas as datas para o grupo
            db.all('SELECT DISTINCT incident_date FROM incidents WHERE GRUPO_DIRECIONADO = ?', [GRUPO_DIRECIONADO], (err, dates) => {
                if (err) throw err;
                dates.forEach(({ incident_date }) => {
                    // Verificar se já existe registro em historical_data
                    db.get('SELECT 1 FROM historical_data WHERE group_name = ? AND date = ?', [GRUPO_DIRECIONADO, incident_date], (err, row) => {
                        if (err) throw err;
                        if (row) return; // Já existe, pular
                        // Buscar todos os incidentes desse grupo/data
                        db.all('SELECT * FROM incidents WHERE GRUPO_DIRECIONADO = ? AND incident_date = ?', [GRUPO_DIRECIONADO, incident_date], (err, incidents) => {
                            if (err) throw err;
                            if (!incidents.length) return;
                            // Agregações
                            const volume = incidents.length;
                            const categories = incidents.map(i => i.CATEGORIA);
                            const priorities = incidents.map(i => i.PRIORIDADE);
                            
                            // Tempo de resolução: diferença DATA_CRIACAO - DATA_ENCERRAMENTO (em minutos)
                            const resolutionTimes = incidents
                                .filter(i => i.DATA_CRIACAO && i.DATA_ENCERRAMENTO)
                                .map(i => (new Date(i.DATA_ENCERRAMENTO) - new Date(i.DATA_CRIACAO)) / 60000)
                                .filter(x => !isNaN(x));
                            db.run(
                                `INSERT INTO historical_data (group_name, date, volume, category, priority, resolution_time, created_at, updated_at)
                                 VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                                [
                                    GRUPO_DIRECIONADO,
                                    incident_date,
                                    volume,
                                    getMostFrequent(categories),
                                    getMostFrequent(priorities),
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