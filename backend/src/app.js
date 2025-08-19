const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const dbConfig = require('./config/database');
const routes = require('./api/routes');
const logger = require('./utils/logger');

/**
 * Função assíncrona para inicializar o aplicativo
 * @returns {Promise<express.Application>} Instância do Express configurada
 */
async function createApp() {
const app = express();

    // Configurações do CORS
    app.use(cors({
        origin: ['http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:8080'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
    }));

app.use(express.json());

    // Middleware de log
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`, {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        next();
    });

    // Configuração do Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
        }
    }));
    
    // Log para informar que a documentação Swagger está disponível
    const PORT = process.env.PORT || 3000;
    logger.info(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);

    // Rota para acessar a especificação do Swagger em formato JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Rotas da API
app.use('/api', routes);

    // Tratamento de erros global
    app.use((err, req, res, next) => {
        logger.error('Erro na aplicação:', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method
        });
        
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    return app;
}

module.exports = { createApp }; 