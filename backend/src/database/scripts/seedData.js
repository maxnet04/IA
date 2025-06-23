const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Ajustar o caminho para apontar corretamente para a pasta data
const dbPath = path.resolve(__dirname, '../../../data/database.sqlite');
const dataDir = path.dirname(dbPath);

// Certificar-se de que a pasta data existe
if (!fs.existsSync(dataDir)) {
    console.log(`Criando diretório de dados em: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`Conectando ao banco de dados em: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

/**
 * Retorna uma data atual real, independentemente de possíveis erros do sistema
 * @returns {Date} Data atual real
 */
function getCurrentDate() {
    // Obter a data do sistema
    const systemDate = new Date();
    
    // Verificar se a data é futura (depois de 2024)
    if (systemDate.getFullYear() >= 2025) {
        console.log(`AVISO: O sistema está retornando uma data futura: ${systemDate.toISOString()}`);
        console.log('Usando a data atual real (hardcoded)');
        
        // Criar uma data atual real (forçada, já que o sistema está retornando uma data futura)
        // Usamos a data atual real (aproximada) - ajuste conforme necessário
        return new Date('2023-11-30');
    }
    
    // Caso contrário, usamos a data do sistema
    return systemDate;
}

// Função para gerar valor aleatório entre min e max
function randomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para inserir usuário admin padrão
async function insertAdminUser() {
    return new Promise((resolve, reject) => {
        // Verifica se o usuário já existe
        db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
            if (err) {
                console.error('Erro ao verificar usuário admin:', err);
                reject(err);
                return;
            }
            
            if (row) {
                console.log('Usuário admin já existe, ignorando criação');
                resolve();
                return;
            }
            
            // Hash da senha
            bcrypt.hash("123456", 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    console.error('Erro ao gerar hash da senha:', hashErr);
                    reject(hashErr);
                    return;
                }
                
                // Insere o usuário admin
                db.run(
                    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                    ["admin", hashedPassword, "admin"],
                    (insertErr) => {
                        if (insertErr) {
                            console.error('Erro ao inserir usuário admin:', insertErr);
                            reject(insertErr);
                            return;
                        }
                        
                        console.log('Usuário admin criado com sucesso');
                        resolve();
                    }
                );
            });
        });
    });
}

// NOVA VERSÃO: Popula apenas a tabela incidents, com muitos incidentes por mês, anomalias e carga complementar
const INCIDENT_CATEGORIES = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'DADOS', 'SEGURANCA', 'FRONTEND', 'BACKEND', 'INTEGRACAO'];
const GROUPS = ['SUPORTE', 'INFRAESTRUTURA', 'DESENVOLVIMENTO', 'SUPORTE_N1', 'SUPORTE_N2', 'DEV', 'DADOS', 'SEGURANCA'];
const PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const ANOMALY_TYPES = ['VOLUME_SPIKE', 'VOLUME_DROP', 'SUSTAINED_INCREASE', 'SUSTAINED_DECREASE', 'CYCLIC_PATTERN'];
const PRODUCTS = ['PRODUTO_A', 'PRODUTO_B', 'PRODUTO_C'];

const ATYPICAL_DATES = [
    // Natal, Ano Novo, Dia das Mães, Dia das Crianças, outros feriados nacionais
    '-12-25', // Natal
    '-01-01', // Ano Novo
    '-05-2',  // Dia das Mães (2º domingo de maio, aproximado para 2ª semana)
    '-10-12', // Dia das Crianças
    '-04-21', // Tiradentes
    '-09-07', // Independência
    '-11-15', // Proclamação da República
    '-06-12', // Dia dos Namorados
    '-11-02', // Finados
    '-12-31'  // Véspera de Ano Novo
];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomTime() {
    const hour = Math.floor(Math.random() * 24);
    const min = Math.floor(Math.random() * 60);
    const sec = Math.floor(Math.random() * 60);
    return { hour, min, sec };
}

function formatDateTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function isAtypical(dateStr) {
    return ATYPICAL_DATES.some(suffix => dateStr.endsWith(suffix));
}

function isFifthBusinessDay(date) {
    // Conta dias úteis do mês
    let count = 0;
    const month = date.getMonth();
    const year = date.getFullYear();
    for (let d = 1; d <= date.getDate(); d++) {
        const temp = new Date(year, month, d);
        if (temp.getDay() !== 0 && temp.getDay() !== 6) count++;
        if (count === 5 && d === date.getDate()) return true;
    }
    return false;
}

function getAnomalyTypeForDay(dayIndex, totalDays) {
    // Alterna tipos de anomalia para garantir cobertura
    if (dayIndex % 31 === 5) return 'VOLUME_SPIKE';
    if (dayIndex % 31 === 10) return 'VOLUME_DROP';
    if (dayIndex % 31 === 15) return 'SUSTAINED_INCREASE';
    if (dayIndex % 31 === 20) return 'SUSTAINED_DECREASE';
    return null;
}

function insertIncidentAsync(db, values) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO incidents (
                product_id, incident_date, DATA_CRIACAO, DATA_ENCERRAMENTO, CATEGORIA, GRUPO_DIRECIONADO, PRIORIDADE, ACAO, volume, is_anomaly, anomaly_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values,
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Função ajustada para gerar variação anual e garantir todos os tipos de anomalia
async function insertIncidentsForProduct(productId, startDate, endDate) {
    let current = new Date(startDate);
    const end = new Date(endDate);
    let dayIndex = 0;
    let yearAtual = null;
    let mesAtual = null;
    const anomalyCount = { VOLUME_SPIKE: 0, VOLUME_DROP: 0, SUSTAINED_INCREASE: 0, SUSTAINED_DECREASE: 0, CYCLIC_PATTERN: 0 };
    while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        if (yearAtual !== year) {
            if (yearAtual !== null) console.log(`[${productId}] Ano ${yearAtual} concluído.`);
            yearAtual = year;
            mesAtual = null;
            console.log(`[${productId}] Gerando dados para o ano ${yearAtual}...`);
        }
        if (mesAtual !== month) {
            mesAtual = month;
            console.log(`[${productId}] Gerando dados para ${String(mesAtual).padStart(2, '0')}/${yearAtual}`);
        }
        const day = current.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Definir se o dia será anomalia (15% dos dias)
        const isAnomalyDay = Math.random() < 0.15; // 15% dos dias, ajustável
        // Volume base para cenário normal, variando por ano
        let baseMin = 15, baseMax = 35;
        if (year === 2023) { baseMin = 10; baseMax = 25; }
        if (year === 2024) { baseMin = 20; baseMax = 40; }
        if (year >= 2025) { baseMin = 30; baseMax = 60; }
        let volume = randomValue(baseMin, baseMax); // Média ajustada por ano
        let isAnomaly = 0;
        let anomalyType = '';
        // Picos em datas especiais e 5º dia útil
        if ((isAtypical(dateStr) || isFifthBusinessDay(current)) && isAnomalyDay) {
            // Pico de anomalia: próximo do máximo permitido
            volume = randomValue(baseMax + 40, baseMax + 60);
            isAnomaly = 1;
            anomalyType = 'VOLUME_SPIKE';
            anomalyCount['VOLUME_SPIKE']++;
        } else if (isAnomalyDay) {
            // Alterna tipos de anomalia para garantir cobertura
            let anomaly = null;
            // Distribuição cíclica dos tipos de anomalia
            if (dayIndex % 31 === 5) anomaly = 'VOLUME_SPIKE';
            else if (dayIndex % 31 === 10) anomaly = 'VOLUME_DROP';
            else if (dayIndex % 31 === 15) anomaly = 'SUSTAINED_INCREASE';
            else if (dayIndex % 31 === 20) anomaly = 'SUSTAINED_DECREASE';
            else if (dayIndex % 7 === 3) anomaly = 'CYCLIC_PATTERN';
            if (anomaly) {
                isAnomaly = 1;
                anomalyType = anomaly;
                anomalyCount[anomaly]++;
                if (anomaly === 'VOLUME_DROP') volume = randomValue(5, Math.max(10, baseMin));
                if (anomaly === 'SUSTAINED_INCREASE') volume = randomValue(baseMax + 20, baseMax + 40);
                if (anomaly === 'SUSTAINED_DECREASE') volume = randomValue(5, Math.max(10, baseMin));
                if (anomaly === 'CYCLIC_PATTERN') volume = (current.getDay() === 1 ? randomValue(baseMax + 30, baseMax + 50) : randomValue(baseMin, baseMax));
            }
        }
        let inserted = 0;
        for (let i = 0; i < volume; i++) {
            const baseDate = new Date(year, month - 1, day);
            const { hour, min, sec } = randomTime();
            baseDate.setHours(hour, min, sec, 0);
            const values = [
                productId,
                dateStr,
                formatDateTime(baseDate),
                null,
                randomChoice(INCIDENT_CATEGORIES),
                randomChoice(GROUPS),
                randomChoice(PRIORITIES),
                randomChoice(['RESOLVIDO', 'DIRECIONADO', 'CANCELADO']),
                1,
                isAnomaly,
                anomalyType
            ];
            await insertIncidentAsync(db, values);
            inserted++;
        }
        if (isAnomaly) {
            console.log(`[${productId}] ${dateStr}: ${inserted} incidentes inseridos (ANOMALIA: ${anomalyType})`);
        } else {
            if (inserted > 0 && (day === 1 || day === 15 || day === 28)) {
                // Logar apenas alguns dias normais para não poluir
                console.log(`[${productId}] ${dateStr}: ${inserted} incidentes inseridos`);
            }
        }
        current.setDate(current.getDate() + 1);
        dayIndex++;
    }
    console.log(`[${productId}] Geração concluída. Anomalias geradas: ` + Object.entries(anomalyCount).map(([k,v]) => `${k}: ${v}`).join(', '));
}

// Iniciar o processo
console.log('Iniciando seed de dados...');
console.log(`Data atual do sistema: ${new Date().toISOString()}`);
console.log(`Data usada pelo script: ${getCurrentDate().toISOString()}`);

// Verificar se a tabela existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='incidents'", async (err, row) => {
    if (err) {
        console.error('Erro ao verificar tabela:', err);
        db.close();
        return;
    }
    
    if (!row) {
        console.error('Tabela incidents não existe. Execute o servidor primeiro para criar as tabelas.');
        db.close();
        return;
    }
    
    // Data de início definida como 01/01/2023
    const startDate = new Date('2023-01-01');
    const endDate = new Date();
    
    try {
        // Inserir usuário admin
        await insertAdminUser();
        
        // Inserir dados para cada produto de forma assíncrona
        const promises = PRODUCTS.map(productId => insertIncidentsForProduct(productId, startDate, endDate));
        
        await Promise.all(promises);
        
        console.log('Todos os dados foram inseridos com sucesso!');
    } catch (error) {
        console.error('Erro durante a inserção de dados:', error);
    } finally {
        db.close();
    }
}); 