const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
            { id: user.id, username: user.username, role: user.roles ? user.roles[0] : 'user' },
            this.jwtSecret,
            { expiresIn: '8h' }
        );

        return { token, user: { id: user.id, username: user.username, role: user.roles ? user.roles[0] : 'user' } };
    }

    async register(username, password, role = 'user') {
        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser) {
            throw new Error('Usuário já existe');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username: username,
            password: hashedPassword,
            roles: [role]
        });
        
        const savedUser = await this.userRepository.save(user);
        return { id: savedUser.id, username: savedUser.username, role: savedUser.roles[0] };
    }
}

module.exports = AuthService; 