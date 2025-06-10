/**
 * Modelo de usuário
 */
class User {
    /**
     * Cria uma instância de Usuário
     * @param {Object} data - Dados do usuário
     * @param {string} data.id - ID do usuário
     * @param {string} data.username - Nome de usuário
     * @param {string} data.email - Email do usuário
     * @param {string} data.password - Senha do usuário (hash)
     * @param {Array<string>} data.roles - Papéis do usuário
     * @param {Date} data.createdAt - Data de criação
     * @param {Date} data.updatedAt - Data de atualização
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.password = data.password || '';
        this.roles = data.roles || ['user'];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    /**
     * Converte um objeto de banco de dados em instância de Usuário
     * @param {Object} dbUser - Objeto de usuário do banco de dados
     * @returns {User} - Instância de usuário
     */
    static fromDatabase(dbUser) {
        if (!dbUser) return null;
        
        return new User({
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            password: dbUser.password,
            roles: JSON.parse(dbUser.roles || '["user"]'),
            createdAt: new Date(dbUser.created_at),
            updatedAt: new Date(dbUser.updated_at)
        });
    }

    /**
     * Converte para objeto seguro (sem a senha)
     * @returns {Object} - Objeto seguro para retorno ao cliente
     */
    toSafeObject() {
        const { password, ...safeUser } = this;
        return safeUser;
    }
}

module.exports = User; 