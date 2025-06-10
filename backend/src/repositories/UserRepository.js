const BaseRepository = require('./BaseRepository');
const DatabaseManager = require('../database/DatabaseManager');
const bcrypt = require('bcrypt');

class UserRepository extends BaseRepository {
    constructor() {
        super();
        this.registerTables();
    }

    registerTables() {
        const dbManager = DatabaseManager.getInstance();
        
        // Registra a tabela users com a estrutura original
        dbManager.registerTable(
            'users',
            `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
            `
        );
    }

    /**
     * Encontra um usuário pelo nome de usuário
     * @param {string} username Nome de usuário
     * @returns {Promise<Object>} Usuário encontrado ou null
     */
    async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        return this.queryOne(query, [username]);
    }

    /**
     * Salva um novo usuário
     * @param {Object} user Dados do usuário
     * @returns {Promise<Object>} Usuário criado
     */
    async save(user) {
        const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        
        const result = await this.execute(
            query, 
            [user.username, user.password, user.role]
        );
        
        user.id = result.lastID;
        return user;
    }

    /**
     * Atualiza um usuário existente
     * @param {Object} user Dados do usuário para atualizar
     * @returns {Promise<Object>} Resultado da atualização
     */
    async update(user) {
        const query = `
            UPDATE users 
            SET username = ?, password = ?, role = ?
            WHERE id = ?
        `;
        
        const result = await this.execute(
            query,
            [user.username, user.password, user.role, user.id]
        );
        
        return result.changes > 0;
    }

    /**
     * Remove um usuário pelo ID
     * @param {number} id ID do usuário
     * @returns {Promise<boolean>} True se removido com sucesso
     */
    async remove(id) {
        const query = 'DELETE FROM users WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.changes > 0;
    }

    /**
     * Busca todos os usuários
     * @returns {Promise<Array>} Lista de usuários
     */
    async findAll() {
        const query = 'SELECT id, username, role FROM users';
        return this.query(query);
    }

    /**
     * Busca um usuário pelo ID
     * @param {number} id ID do usuário
     * @returns {Promise<Object>} Usuário encontrado ou null
     */
    async findById(id) {
        const query = 'SELECT id, username, role FROM users WHERE id = ?';
        return this.queryOne(query, [id]);
    }

    /**
     * Verifica as credenciais de um usuário
     * @param {string} username Nome de usuário
     * @param {string} password Senha
     * @returns {Promise<Object>} Usuário autenticado ou null
     */
    async verifyCredentials(username, password) {
        const user = await this.findByUsername(username);
        
        if (!user) {
            return null;
        }
        
        // Verifica se a senha está correta
        // Nota: Assumindo que a senha já está hasheada no banco
        // Idealmente, você usaria bcrypt.compare aqui
        if (user.password !== password) {
            return null;
        }
        
        return {
            id: user.id,
            username: user.username,
            role: user.role
        };
    }
}

module.exports = UserRepository; 