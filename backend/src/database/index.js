const DatabaseManager = require('./DatabaseManager');
const DatabaseInitializer = require('./DatabaseInitializer');
const BaseRepository = require('../repositories/BaseRepository');

/**
 * Inicializa o banco de dados e todos os repositórios
 * @returns {Promise<Object>} Objeto com todos os repositórios disponíveis
 */
async function initializeDatabase() {
    const initializer = new DatabaseInitializer();
    const { repositories } = await initializer.initialize();
    
    // Retorna um objeto com todos os repositórios disponíveis
    const repositoriesMap = {};
    for (const [name, instance] of repositories.entries()) {
        // Remove o sufixo 'Repository' para criar chaves mais amigáveis
        const shortName = name.replace('Repository', '');
        repositoriesMap[shortName] = instance;
    }
    
    return {
        dbManager: DatabaseManager.getInstance(),
        initializer,
        repositories: repositoriesMap,
        getRepository: (name) => initializer.getRepository(name)
    };
}

module.exports = {
    DatabaseManager,
    DatabaseInitializer,
    BaseRepository,
    initializeDatabase
}; 