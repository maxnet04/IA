/**
 * FASE 1 - PREPARAÇÃO E ANÁLISE
 * Script para análise dos dados existentes e preparação da migração
 */

const path = require('path');
const fs = require('fs');

// Usar sqlite3 do backend
const sqlite3Path = path.resolve(__dirname, '../backend/node_modules/sqlite3');
const sqlite3 = require(sqlite3Path).verbose();

const DB_PATH = path.resolve(__dirname, '../backend/data/database.sqlite');
const BACKUP_PATH = path.resolve(__dirname, '../backend/data/database.sqlite.backup.' + new Date().toISOString().split('T')[0]);
const RESULTS_PATH = path.resolve(__dirname, 'migration-analysis.json');

class MigrationPreparation {
    constructor() {
        this.db = null;
        this.results = {
            grupos: [],
            estatisticas: {},
            dependencias: [],
            validacoes: []
        };
    }

    async initialize() {
        console.log('🚀 Iniciando Fase 1 - Preparação e Análise');
        
        // Verificar se o banco existe
        if (!fs.existsSync(DB_PATH)) {
            throw new Error(`Banco de dados não encontrado: ${DB_PATH}`);
        }

        // Criar backup
        await this.createBackup();
        
        // Conectar ao banco
        this.db = new sqlite3.Database(DB_PATH);
        
        console.log('✅ Inicialização concluída');
    }

    async createBackup() {
        console.log('📦 Criando backup do banco de dados...');
        
        try {
            fs.copyFileSync(DB_PATH, BACKUP_PATH);
            console.log(`✅ Backup criado: ${BACKUP_PATH}`);
        } catch (error) {
            throw new Error(`Erro ao criar backup: ${error.message}`);
        }
    }

    async analyzeGroups() {
        console.log('📊 Analisando grupos existentes...');

        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    GRUPO_DIRECIONADO,
                    COUNT(*) as total_incidents,
                    COUNT(DISTINCT CATEGORIA) as unique_categories,
                    MIN(DATA_CRIACAO) as first_incident,
                    MAX(DATA_CRIACAO) as last_incident,
                    COUNT(CASE WHEN ACAO = 'RESOLVIDO' THEN 1 END) as resolved_count,
                    COUNT(CASE WHEN ACAO = 'DIRECIONADO' THEN 1 END) as redirected_count,
                    COUNT(CASE WHEN ACAO = 'CANCELADO' THEN 1 END) as cancelled_count
                FROM incidents 
                WHERE GRUPO_DIRECIONADO IS NOT NULL 
                GROUP BY GRUPO_DIRECIONADO
                ORDER BY total_incidents DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.results.grupos = rows;
                console.log(`✅ Encontrados ${rows.length} grupos distintos`);
                
                // Exibir resumo
                rows.forEach(group => {
                    console.log(`   📋 ${group.GRUPO_DIRECIONADO}: ${group.total_incidents} incidentes`);
                });

                resolve(rows);
            });
        });
    }

    async analyzeCurrentProductUsage() {
        console.log('🔍 Analisando uso atual de produtos...');

        return new Promise((resolve, reject) => {
            const queries = [
                // Verificar tabela historical_data
                {
                    name: 'historical_data_products',
                    query: 'SELECT DISTINCT product_id, COUNT(*) as records FROM historical_data GROUP BY product_id'
                },
                // Verificar incidentes por produto (se existir)
                {
                    name: 'incidents_products',
                    query: 'SELECT DISTINCT product_id, COUNT(*) as records FROM incidents WHERE product_id IS NOT NULL GROUP BY product_id'
                },
                // Verificar notificações por produto
                {
                    name: 'notifications_products',
                    query: 'SELECT DISTINCT product_id, COUNT(*) as records FROM notifications GROUP BY product_id'
                }
            ];

            const results = {};
            let completed = 0;

            queries.forEach(queryInfo => {
                this.db.all(queryInfo.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Erro na query ${queryInfo.name}: ${err.message}`);
                        results[queryInfo.name] = [];
                    } else {
                        results[queryInfo.name] = rows || [];
                        console.log(`   ✅ ${queryInfo.name}: ${rows ? rows.length : 0} produtos distintos`);
                    }
                    
                    completed++;
                    if (completed === queries.length) {
                        this.results.estatisticas.produtos_atuais = results;
                        resolve(results);
                    }
                });
            });
        });
    }

    async analyzeDependencies() {
        console.log('🔗 Mapeando dependências...');

        const dependencies = [
            {
                type: 'frontend_components',
                files: [
                    'frontend/src/presentation/components/PredictiveAnalysis/index.js',
                    'frontend/src/presentation/pages/RecommendationsPage/index.js',
                    'frontend/src/presentation/pages/AnomaliesPage/index.js'
                ]
            },
            {
                type: 'frontend_hooks',
                files: [
                    'frontend/src/application/hooks/usePredictiveAnalysis.js',
                    'frontend/src/application/hooks/useRecommendations.js',
                    'frontend/src/application/hooks/useAnomalies.js'
                ]
            },
            {
                type: 'backend_services',
                files: [
                    'backend/src/services/PredictiveAnalysisService.js',
                    'backend/src/services/RecommendationService.js',
                    'backend/src/repositories/HistoricalDataRepository.js'
                ]
            },
            {
                type: 'backend_controllers',
                files: [
                    'backend/src/controllers/PredictiveAnalysisController.js',
                    'backend/src/controllers/PredictiveController.js'
                ]
            }
        ];

        const dependencyReport = [];

        for (const dep of dependencies) {
            const typeReport = {
                type: dep.type,
                files: []
            };

            for (const file of dep.files) {
                const fullPath = path.resolve(__dirname, '..', file);
                const exists = fs.existsSync(fullPath);
                
                typeReport.files.push({
                    path: file,
                    exists,
                    needsModification: exists
                });

                console.log(`   ${exists ? '✅' : '❌'} ${file}`);
            }

            dependencyReport.push(typeReport);
        }

        this.results.dependencias = dependencyReport;
        return dependencyReport;
    }

    async validateDataIntegrity() {
        console.log('🔍 Validando integridade dos dados...');

        const validations = [
            {
                name: 'grupos_nulos',
                query: 'SELECT COUNT(*) as count FROM incidents WHERE GRUPO_DIRECIONADO IS NULL',
                description: 'Incidentes sem grupo direcionado'
            },
            {
                name: 'produtos_vazios',
                query: 'SELECT COUNT(*) as count FROM historical_data WHERE product_id IS NULL OR product_id = ""',
                description: 'Registros históricos sem produto'
            },
            {
                name: 'inconsistencia_datas',
                query: 'SELECT COUNT(*) as count FROM incidents WHERE DATA_CRIACAO > DATA_ENCERRAMENTO AND DATA_ENCERRAMENTO IS NOT NULL',
                description: 'Incidentes com datas inconsistentes'
            }
        ];

        const validationResults = [];

        for (const validation of validations) {
            await new Promise((resolve, reject) => {
                this.db.get(validation.query, (err, row) => {
                    if (err) {
                        validationResults.push({
                            ...validation,
                            error: err.message,
                            status: 'error'
                        });
                    } else {
                        const status = row.count === 0 ? 'ok' : 'warning';
                        validationResults.push({
                            ...validation,
                            count: row.count,
                            status
                        });
                        
                        const icon = status === 'ok' ? '✅' : '⚠️';
                        console.log(`   ${icon} ${validation.description}: ${row.count}`);
                    }
                    resolve();
                });
            });
        }

        this.results.validacoes = validationResults;
        return validationResults;
    }

    async generateMigrationScript() {
        console.log('📝 Gerando script de migração...');

        const migrationScript = `
-- SCRIPT DE MIGRAÇÃO: PRODUTO → GRUPO DIRECIONADO
-- Gerado automaticamente em: ${new Date().toISOString()}

-- 1. Criar tabela temporária para mapeamento
CREATE TABLE IF NOT EXISTS temp_group_mapping (
    old_product_id TEXT,
    new_group_id TEXT,
    group_name TEXT,
    migration_date TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Popular mapeamento baseado nos dados existentes
${this.results.grupos.map(group => 
    `INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', '${group.GRUPO_DIRECIONADO}', '${group.GRUPO_DIRECIONADO}');`
).join('\n')}

-- 3. Criar nova estrutura de dados históricos por grupo
CREATE TABLE IF NOT EXISTS historical_data_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    date TEXT NOT NULL,
    volume INTEGER NOT NULL,
    category TEXT,
    priority TEXT,
    resolution_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, date)
);

-- 4. Migrar dados históricos
INSERT OR IGNORE INTO historical_data_groups (group_id, date, volume, category, priority, resolution_time)
SELECT 
    incidents.GRUPO_DIRECIONADO as group_id,
    DATE(incidents.DATA_CRIACAO) as date,
    COUNT(*) as volume,
    GROUP_CONCAT(DISTINCT incidents.CATEGORIA) as category,
    GROUP_CONCAT(DISTINCT incidents.PRIORIDADE) as priority,
    AVG(
        CASE 
            WHEN incidents.DATA_ENCERRAMENTO IS NOT NULL 
            THEN (julianday(incidents.DATA_ENCERRAMENTO) - julianday(incidents.DATA_CRIACAO)) * 24 * 60 
        END
    ) as resolution_time
FROM incidents 
WHERE incidents.GRUPO_DIRECIONADO IS NOT NULL
GROUP BY incidents.GRUPO_DIRECIONADO, DATE(incidents.DATA_CRIACAO)
ORDER BY incidents.GRUPO_DIRECIONADO, DATE(incidents.DATA_CRIACAO);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_historical_groups_group_date ON historical_data_groups(group_id, date);
CREATE INDEX IF NOT EXISTS idx_historical_groups_date ON historical_data_groups(date);

-- 6. Validar migração
SELECT 
    'Grupos migrados' as metric,
    COUNT(DISTINCT group_id) as value
FROM historical_data_groups
UNION ALL
SELECT 
    'Registros de dados históricos' as metric,
    COUNT(*) as value
FROM historical_data_groups;
        `;

        const scriptPath = path.resolve(__dirname, 'migration-data.sql');
        fs.writeFileSync(scriptPath, migrationScript);
        
        console.log(`✅ Script de migração salvo: ${scriptPath}`);
        return scriptPath;
    }

    async generateReport() {
        console.log('📊 Gerando relatório de análise...');

        const report = {
            timestamp: new Date().toISOString(),
            phase: 'FASE 1 - PREPARAÇÃO E ANÁLISE',
            summary: {
                total_groups: this.results.grupos.length,
                total_incidents: this.results.grupos.reduce((sum, g) => sum + g.total_incidents, 0),
                backup_created: fs.existsSync(BACKUP_PATH),
                dependencies_mapped: this.results.dependencias.length,
                validation_issues: this.results.validacoes.filter(v => v.status === 'warning').length
            },
            details: this.results,
            next_steps: [
                'Revisar grupos identificados',
                'Verificar dependências mapeadas',
                'Resolver questões de validação se houver',
                'Prosseguir para Fase 2 - Backend'
            ]
        };

        fs.writeFileSync(RESULTS_PATH, JSON.stringify(report, null, 2));
        
        console.log(`✅ Relatório salvo: ${RESULTS_PATH}`);
        return report;
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }

    async execute() {
        try {
            await this.initialize();
            await this.analyzeGroups();
            await this.analyzeCurrentProductUsage();
            await this.analyzeDependencies();
            await this.validateDataIntegrity();
            await this.generateMigrationScript();
            const report = await this.generateReport();
            await this.close();

            console.log('\n🎉 FASE 1 CONCLUÍDA COM SUCESSO!');
            console.log('\n📊 RESUMO:');
            console.log(`   • ${report.summary.total_groups} grupos identificados`);
            console.log(`   • ${report.summary.total_incidents} incidentes totais`);
            console.log(`   • ${report.summary.dependencies_mapped} tipos de dependências mapeadas`);
            console.log(`   • ${report.summary.validation_issues} questões de validação`);
            
            if (report.summary.validation_issues > 0) {
                console.log('\n⚠️  ATENÇÃO: Existem questões de validação que devem ser resolvidas antes de prosseguir');
            } else {
                console.log('\n✅ Pronto para prosseguir para a Fase 2!');
            }

            return report;

        } catch (error) {
            console.error('❌ Erro na execução da Fase 1:', error.message);
            await this.close();
            throw error;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const preparation = new MigrationPreparation();
    preparation.execute()
        .then(report => {
            console.log('\n📋 Próximos passos:');
            report.next_steps.forEach(step => console.log(`   • ${step}`));
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Falha na preparação:', error);
            process.exit(1);
        });
}

module.exports = MigrationPreparation; 