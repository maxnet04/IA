const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Configuração do Swagger para documentação da API
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API do SUAT-IA',
      version: '1.0.0',
      description: 'API do Sistema Unificado de Análise e Tratamento de Incidentes com Inteligência Artificial',
      contact: {
        name: 'Equipe SUAT-IA',
        email: 'suporte@suat-ia.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://api.suat-ia.com',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Caminho para os arquivos com anotações JSDoc
  apis: [
    './src/api/routes/*.js',
    './src/api/models/*.js',
    './src/routes/*.js',
  ],
};

// Gera a especificação do Swagger com base nas anotações JSDoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 