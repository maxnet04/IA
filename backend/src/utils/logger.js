/**
 * Módulo de logging para a aplicação
 * Em uma implementação real, isso poderia usar winston ou pino
 */
const logger = {
    /**
     * Registra mensagem de debug
     * @param {string} message - Mensagem a ser registrada
     * @param {Object} meta - Metadados adicionais
     */
    debug: (message, ...args) => {
        console.log(`[DEBUG] ${message}`, ...args);
    },

    /**
     * Registra mensagem informativa
     * @param {string} message - Mensagem a ser registrada
     * @param {Object} meta - Metadados adicionais
     */
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
    },

    /**
     * Registra mensagem de aviso
     * @param {string} message - Mensagem a ser registrada
     * @param {Object} meta - Metadados adicionais
     */
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
    },

    /**
     * Registra mensagem de erro
     * @param {string} message - Mensagem a ser registrada
     * @param {Object} meta - Metadados adicionais
     */
    error: (message, error) => {
        console.error(`[ERROR] ${message}`);
        if (error instanceof Error) {
            console.error(`- Message: ${error.message}`);
            console.error(`- Stack: ${error.stack}`);
        } else if (error) {
            console.error('- Details:', error);
        }
    }
};

module.exports = logger; 