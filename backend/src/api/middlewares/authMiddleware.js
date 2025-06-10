const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware de autenticação que verifica tokens JWT
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 */
const authMiddleware = (req, res, next) => {
    // Adiciona um ID único para a requisição
    req.id = uuidv4();
    
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        console.debug(`[AUTH] Verificando token de autenticação`, {
            requestId: req.id,
            hasToken: !!token,
            method: req.method,
            url: req.originalUrl
        });
        
        if (!token) {
            console.warn(`[AUTH] Token de autenticação não fornecido`, {
                requestId: req.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação não fornecido'
            });
        }

        // Usando a mesma chave secreta que é usada no AuthController
        const jwtSecret = 'secret_key';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        
        console.info(`[AUTH] Usuário autenticado com sucesso`, {
            requestId: req.id,
            userId: decoded.id,
            username: decoded.username,
            roles: decoded.roles
        });
        
        next();
    } catch (error) {
        console.error(`[AUTH] Erro na autenticação: ${error.message}`, {
            requestId: req.id,
            error: error.message,
            stack: error.stack
        });
        
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
        });
    }
};

module.exports = authMiddleware; 