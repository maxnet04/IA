const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./DatabaseManager');

class DatabaseInitializer {
    constructor() {
        this.dbManager = DatabaseManager.getInstance();
        this.repositories = new Map();
    }

    /**
     * Carrega todos os repositórios da pasta repositories
     */
    async loadRepositories() {
        try {
            const repositoriesPath = path.join(__dirname, '../../repositories');
            const files = fs.readdirSync(repositoriesPath);
            
            for (const file of files) {
                // Ignora o BaseRepository e arquivos que não são JavaScript
                if (file === 'BaseRepository.js' || !file.endsWith('.js')) {
                    continue;
                }

                const RepositoryClass = require(path.join(repositoriesPath, file));
                const repositoryName = file.replace('.js', '');
                const repository = new RepositoryClass();
                
                this.repositories.set(repositoryName, repository);
                console.log(`Repositório ${repositoryName} carregado com sucesso`);
            }
        } catch (error) {
            console.error('Erro ao carregar repositórios:', error);
            throw error;
        }
    }

    /**
     * Inicializa o banco de dados e todos os repositórios
     */
    async initialize() {
        try {
            await this.loadRepositories();
            await this.dbManager.init();
            console.log('Banco de dados inicializado com sucesso');
            return {
                repositories: this.repositories,
                dbManager: this.dbManager
            };
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            throw error;
        }
    }

    /**
     * Fecha a conexão com o banco de dados
     */
    async close() {
        await this.dbManager.close();
    }

    /**
     * Obtém uma instância de um repositório pelo nome
     * @param {string} name Nome do repositório (sem o sufixo 'Repository')
     * @returns {Object} Instância do repositório
     */
    getRepository(name) {
        const repositoryName = name.endsWith('Repository') ? name : `${name}Repository`;
        const repository = this.repositories.get(repositoryName);
        
        if (!repository) {
            throw new Error(`Repositório ${repositoryName} não encontrado`);
        }
        
        return repository;
    }
}

module.exports = DatabaseInitializer; 