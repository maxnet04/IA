const express = require('express');
const authRoutes = require('./authRoutes');
const predictiveAnalysisRoutes = require('./predictiveAnalysisRoutes');
const incidentRoutes = require('./incidentRoutes');
const groupRoutes = require('./groupRoutes');
const IncidentController = require('../../controllers/IncidentController');
const AuthController = require('../../controllers/AuthController');
const UserRepository = require('../../repositories/UserRepository');

const router = express.Router();

// Configuração do repositório e serviços
const userRepository = new UserRepository();
const authController = new AuthController(userRepository);

// Rotas de autenticação
router.use('/auth', authRoutes(authController));

// Rotas de análise preditiva
router.use('/predictive', predictiveAnalysisRoutes);

// Rotas de incidentes
const incidentController = new IncidentController();
router.use('/incidents', incidentRoutes(incidentController));

// Rotas de grupos
router.use('/groups', groupRoutes);

module.exports = router; 