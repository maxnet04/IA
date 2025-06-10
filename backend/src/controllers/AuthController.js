const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');

class AuthController {
    constructor(userRepository) {
        this.userRepository = userRepository || new UserRepository();
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    error: true,
                    message: 'Username e password são obrigatórios'
                });
            }

            const user = await this.userRepository.findByUsername(username);
            
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                throw new Error('Senha inválida');
            }
            
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                'secret_key',
                { expiresIn: '24h' }
            );
            
            return res.status(200).json({
                error: false,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    }
                },
                message: 'Login realizado com sucesso'
            });
        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(401).json({
                error: true,
                message: error.message || 'Credenciais inválidas'
            });
        }
    }

    async register(req, res) {
        try {
            const { username, password, role = 'user' } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    error: true,
                    message: 'Username e password são obrigatórios'
                });
            }

            const existingUser = await this.userRepository.findByUsername(username);
            
            if (existingUser) {
                throw new Error('Usuário já existe');
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = await this.userRepository.save({
                username,
                password: hashedPassword,
                role
            });
            
            return res.status(201).json({
                error: false,
                data: {
                    id: newUser.id,
                    username: newUser.username,
                    role: newUser.role
                },
                message: 'Usuário registrado com sucesso'
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            return res.status(400).json({
                error: true,
                message: error.message || 'Erro ao registrar usuário'
            });
        }
    }

    async checkAuth(req, res) {
        try {
            return res.status(200).json({
                error: false,
                data: {
                    valid: true,
                    user: req.user
                },
                message: 'Token válido'
            });
        } catch (error) {
            console.error('Erro na verificação de autenticação:', error);
            return res.status(401).json({
                error: true,
                message: 'Token inválido ou expirado'
            });
        }
    }
}

module.exports = AuthController; 