const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = (authController) => {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Registra um novo usuário
     *     tags: [Autenticação]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *                 description: Nome de usuário
     *               password:
     *                 type: string
     *                 description: Senha do usuário
     *               role:
     *                 type: string
     *                 description: Papel do usuário (admin ou user)
     *           example:
     *             username: "novo_usuario"
     *             password: "senha123"
     *             role: "user"
     *     responses:
     *       201:
     *         description: Usuário criado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                       example: 1
     *                     username:
     *                       type: string
     *                       example: "novo_usuario"
     *                     role:
     *                       type: string
     *                       example: "user"
     *                 message:
     *                   type: string
     *                   example: "Usuário registrado com sucesso"
     *             example:
     *               error: false
     *               data:
     *                 id: 1
     *                 username: "novo_usuario"
     *                 role: "user"
     *               message: "Usuário registrado com sucesso"
     *       400:
     *         description: Dados inválidos ou usuário já existe
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Usuário já existe"
     */
    router.post('/register', (req, res) => authController.register(req, res));

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Realiza login do usuário
     *     tags: [Autenticação]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *                 description: Nome de usuário
     *               password:
     *                 type: string
     *                 description: Senha do usuário
     *           example:
     *             username: "usuario_existente"
     *             password: "senha123"
     *     responses:
     *       200:
     *         description: Login realizado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   example: false
     *                   description: Indica se houve erro
     *                 data:
     *                   type: object
     *                   properties:
     *                     token:
     *                       type: string
     *                       description: Token JWT
     *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjIwMDAwMDAwfQ.example-token"
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 1
     *                         username:
     *                           type: string
     *                           example: "usuario_existente"
     *                         role:
     *                           type: string
     *                           example: "admin"
     *                 message:
     *                   type: string
     *                   description: Mensagem de sucesso
     *                   example: "Login realizado com sucesso"
     *             example:
     *               error: false
     *               data:
     *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjIwMDAwMDAwfQ.example-token"
     *                 user:
     *                   id: 1
     *                   username: "usuario_existente"
     *                   role: "admin"
     *               message: "Login realizado com sucesso"
     *       401:
     *         description: Credenciais inválidas
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Credenciais inválidas"
     */
    router.post('/login', (req, res) => authController.login(req, res));

    /**
     * @swagger
     * /api/auth/check:
     *   get:
     *     summary: Verifica se o token é válido
     *     tags: [Autenticação]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token válido
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: boolean
     *                   description: Indica se houve erro
     *                   example: false
     *                 data:
     *                   type: object
     *                   properties:
     *                     valid:
     *                       type: boolean
     *                       description: Indica se o token é válido
     *                       example: true
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 1
     *                         username:
     *                           type: string
     *                           example: "usuario_existente"
     *                         role:
     *                           type: string
     *                           example: "admin"
     *                 message:
     *                   type: string
     *                   description: Mensagem de sucesso
     *                   example: "Token válido"
     *             example:
     *               error: false
     *               data:
     *                 valid: true
     *                 user:
     *                   id: 1
     *                   username: "usuario_existente"
     *                   role: "admin"
     *               message: "Token válido"
     *       401:
     *         description: Token inválido ou expirado
     *         content:
     *           application/json:
     *             example:
     *               error: true
     *               message: "Token inválido ou expirado"
     */
    router.get('/check', authMiddleware, (req, res) => authController.checkAuth(req, res));
    
    return router;
}; 