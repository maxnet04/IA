const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../domain/entities/User');

class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.jwtSecret = process.env.JWT_SECRET || 'sua-chave-secreta';
    }

    async login(username, password) {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Senha inválida');
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            this.jwtSecret,
            { expiresIn: '8h' }
        );

        return { token, user: { id: user.id, username: user.username, role: user.role } };
    }

    async register(username, password, role = 'user') {
        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser) {
            throw new Error('Usuário já existe');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(null, username, hashedPassword, role);
        
        const savedUser = await this.userRepository.save(user);
        return { id: savedUser.id, username: savedUser.username, role: savedUser.role };
    }
}

module.exports = AuthService; 