/**
 * PLANO DE ROLLBACK - MIGRAÇÃO PRODUTO → GRUPO DIRECIONADO
 * Script para reverter a migração em caso de problemas
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../backend/data/database.sqlite');
const BACKUP_DIR = path.resolve(__dirname, '../backend/data/backups');

class RollbackManager {
    constructor() {
        this.db = null;
        this.backupInfo = null;
    }

    async initialize() {
        console.log('🔄 Iniciando processo de rollback...');
        
        // Verificar backups disponíveis
        await this.listAvailableBackups();
        
        // Conectar ao banco atual
        if (fs.existsSync(DB_PATH)) {
            this.db = new sqlite3.Database(DB_PATH);
        }
    }

    async listAvailableBackups() {
        console.log('📦 Buscando backups disponíveis...');
        
        const backupPattern = /database\.sqlite\.backup\.(\d{4}-\d{2}-\d{2})/;
        const backupFiles = [];
        
        // Verificar na pasta data
        const dataDir = path.resolve(__dirname, '../backend/data');
        if (fs.existsSync(dataDir)) {
            const files = fs.readdirSync(dataDir);
            files.forEach(file => {
                const match = file.match(backupPattern);
                if (match) {
                    const filePath = path.join(dataDir, file);
                    const stats = fs.statSync(filePath);
                    backupFiles.push({
                        file,
                        path: filePath,
                        date: match[1],
                        size: stats.size,
                        created: stats.birthtime
                    });
                }
            });
        }
        
        // Verificar na pasta de backups
        if (fs.existsSync(BACKUP_DIR)) {
            const files = fs.readdirSync(BACKUP_DIR);
            files.forEach(file => {
                const match = file.match(backupPattern);
                if (match) {
                    const filePath = path.join(BACKUP_DIR, file);
                    const stats = fs.statSync(filePath);
                    backupFiles.push({
                        file,
                        path: filePath,
                        date: match[1],
                        size: stats.size,
                        created: stats.birthtime
                    });
                }
            });
        }
        
        // Ordenar por data de criação (mais recente primeiro)
        backupFiles.sort((a, b) => b.created - a.created);
        
        if (backupFiles.length === 0) {
            throw new Error('❌ Nenhum backup encontrado! Rollback não é possível.');
        }
        
        console.log(`✅ Encontrados ${backupFiles.length} backups:`);
        backupFiles.forEach((backup, index) => {
            const sizeKB = (backup.size / 1024).toFixed(2);
            console.log(`   ${index + 1}. ${backup.file} (${sizeKB}KB) - ${backup.created.toISOString()}`);
        });
        
        this.backupInfo = backupFiles;
        return backupFiles;
    }

    async createPreRollbackBackup() {
        console.log('💾 Criando backup do estado atual antes do rollback...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const preRollbackPath = path.resolve(__dirname, `../backend/data/database.sqlite.pre-rollback.${timestamp}`);
        
        try {
            fs.copyFileSync(DB_PATH, preRollbackPath);
            console.log(`✅ Backup pré-rollback criado: ${preRollbackPath}`);
            return preRollbackPath;
        } catch (error) {
            throw new Error(`Erro ao criar backup pré-rollback: ${error.message}`);
        }
    }

    async restoreDatabase(backupIndex = 0) {
        if (!this.backupInfo || this.backupInfo.length === 0) {
            throw new Error('Nenhum backup disponível para restauração');
        }
        
        const selectedBackup = this.backupInfo[backupIndex];
        if (!selectedBackup) {
            throw new Error(`Backup não encontrado no índice ${backupIndex}`);
        }
        
        console.log(`🔄 Restaurando banco de dados de: ${selectedBackup.file}`);
        
        try {
            // Fechar conexão atual se existir
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            
            // Criar backup do estado atual
            await this.createPreRollbackBackup();
            
            // Restaurar banco
            fs.copyFileSync(selectedBackup.path, DB_PATH);
            console.log(`✅ Banco restaurado com sucesso`);
            
            // Reconectar
            this.db = new sqlite3.Database(DB_PATH);
            
            return true;
        } catch (error) {
            throw new Error(`Erro ao restaurar banco: ${error.message}`);
        }
    }

    async validateRestoredDatabase() {
        console.log('🔍 Validando banco restaurado...');
        
        const validations = [
            {
                name: 'incidents_table',
                query: 'SELECT COUNT(*) as count FROM incidents',
                description: 'Registros na tabela incidents'
            },
            {
                name: 'historical_data_table',
                query: 'SELECT COUNT(*) as count FROM historical_data',  
                description: 'Registros na tabela historical_data'
            },
            {
                name: 'product_usage',
                query: 'SELECT COUNT(DISTINCT product_id) as count FROM historical_data WHERE product_id IS NOT NULL',
                description: 'Produtos distintos em historical_data'
            },
            {
                name: 'group_data',
                query: 'SELECT COUNT(DISTINCT GRUPO_DIRECIONADO) as count FROM incidents WHERE GRUPO_DIRECIONADO IS NOT NULL',
                description: 'Grupos distintos em incidents'
            }
        ];
        
        const results = [];
        
        for (const validation of validations) {
            await new Promise((resolve, reject) => {
                this.db.get(validation.query, (err, row) => {
                    if (err) {
                        results.push({
                            name: validation.name,
                            description: validation.description,
                            error: err.message,
                            status: 'error'
                        });
                    } else {
                        results.push({
                            name: validation.name,
                            description: validation.description,
                            count: row.count,
                            status: 'ok'
                        });
                        console.log(`   ✅ ${validation.description}: ${row.count}`);
                    }
                    resolve();
                });
            });
        }
        
        const errors = results.filter(r => r.status === 'error');
        if (errors.length > 0) {
            console.log('❌ Erros encontrados na validação:');
            errors.forEach(error => {
                console.log(`   • ${error.description}: ${error.error}`);
            });
            return false;
        }
        
        console.log('✅ Banco restaurado validado com sucesso');
        return true;
    }

    async cleanupMigrationArtifacts() {
        console.log('🧹 Limpando artefatos da migração...');
        
        const cleanupQueries = [
            'DROP TABLE IF EXISTS temp_group_mapping',
            'DROP TABLE IF EXISTS historical_data_groups',
            'DROP INDEX IF EXISTS idx_historical_groups_group_date',
            'DROP INDEX IF EXISTS idx_historical_groups_date'
        ];
        
        for (const query of cleanupQueries) {
            await new Promise((resolve) => {
                this.db.run(query, (err) => {
                    if (err) {
                        console.log(`   ⚠️ Aviso ao executar: ${query} - ${err.message}`);
                    } else {
                        console.log(`   ✅ Executado: ${query}`);
                    }
                    resolve();
                });
            });
        }
        
        console.log('✅ Limpeza concluída');
    }

    async generateRollbackReport() {
        console.log('📊 Gerando relatório de rollback...');
        
        const report = {
            timestamp: new Date().toISOString(),
            action: 'ROLLBACK EXECUTADO',
            backup_restored: this.backupInfo ? this.backupInfo[0].file : 'N/A',
            validation_passed: true,
            next_steps: [
                'Verificar se aplicação está funcionando corretamente',
                'Analisar logs para identificar causa da necessidade de rollback',
                'Planejar nova tentativa de migração se necessário'
            ]
        };
        
        const reportPath = path.resolve(__dirname, `rollback-report-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`✅ Relatório de rollback salvo: ${reportPath}`);
        return report;
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }

    async executeRollback(backupIndex = 0) {
        try {
            await this.initialize();
            await this.restoreDatabase(backupIndex);
            const isValid = await this.validateRestoredDatabase();
            
            if (!isValid) {
                throw new Error('Validação do banco restaurado falhou');
            }
            
            await this.cleanupMigrationArtifacts();
            const report = await this.generateRollbackReport();
            await this.close();
            
            console.log('\n🎉 ROLLBACK CONCLUÍDO COM SUCESSO!');
            console.log('\n📋 Próximos passos:');
            report.next_steps.forEach(step => console.log(`   • ${step}`));
            
            return report;
            
        } catch (error) {
            console.error('❌ Erro durante rollback:', error.message);
            await this.close();
            throw error;
        }
    }

    // Método interativo para seleção de backup
    async interactiveRollback() {
        try {
            await this.initialize();
            
            if (this.backupInfo.length === 0) {
                throw new Error('Nenhum backup disponível');
            }
            
            console.log('\n🔄 ROLLBACK INTERATIVO');
            console.log('Selecione o backup para restaurar:');
            
            this.backupInfo.forEach((backup, index) => {
                const sizeKB = (backup.size / 1024).toFixed(2);
                console.log(`   ${index + 1}. ${backup.date} (${sizeKB}KB) - ${backup.created.toISOString()}`);
            });
            
            // Por padrão, usar o backup mais recente (índice 0)
            const selectedIndex = 0;
            
            console.log(`\n📦 Usando backup mais recente: ${this.backupInfo[selectedIndex].file}`);
            
            const report = await this.executeRollback(selectedIndex);
            return report;
            
        } catch (error) {
            console.error('❌ Erro no rollback interativo:', error.message);
            throw error;
        }
    }
}

// Comandos disponíveis
const commands = {
    list: async () => {
        const rollback = new RollbackManager();
        await rollback.listAvailableBackups();
        await rollback.close();
    },
    
    execute: async (backupIndex = 0) => {
        const rollback = new RollbackManager();
        await rollback.executeRollback(parseInt(backupIndex));
    },
    
    interactive: async () => {
        const rollback = new RollbackManager();
        await rollback.interactiveRollback();
    }
};

// Executar se chamado diretamente
if (require.main === module) {
    const command = process.argv[2] || 'interactive';
    const arg = process.argv[3];
    
    if (commands[command]) {
        commands[command](arg)
            .then(() => {
                console.log('\n✅ Comando executado com sucesso');
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Erro:', error.message);
                process.exit(1);
            });
    } else {
        console.log('❌ Comando inválido. Comandos disponíveis:');
        console.log('   • list - Lista backups disponíveis');
        console.log('   • execute [index] - Executa rollback do backup no índice especificado');
        console.log('   • interactive - Rollback interativo (padrão)');
        process.exit(1);
    }
}

module.exports = RollbackManager; 