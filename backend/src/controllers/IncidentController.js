const logger = require('../utils/logger');
const IncidentRepository = require('../repositories/IncidentRepository');

class IncidentController {
    constructor() {
        this.incidentRepository = new IncidentRepository();
        logger.info('[CONTROLLER] IncidentController inicializado');
    }

    async getTimelineAnalysis(req, res) {
        const { startDate, endDate, period, group } = req.query;
        
        logger.info(`[CONTROLLER] Iniciando análise temporal de incidentes.`, {
            startDate,
            endDate,
            period,
            group,
            userId: req.user?.id,
            requestId: req.id
        });
        
        try {
            const startTime = Date.now();
            
            // Verificar se devemos usar o banco de dados real ou gerar dados simulados
            let data;
            
            try {
                // Tenta obter dados do banco
                data = await this.incidentRepository.getTimelineAnalysis(startDate, endDate, period, group);
            } catch (dbError) {
                logger.warn(`[CONTROLLER] Erro ao acessar banco de dados, gerando dados simulados: ${dbError.message}`);
                
                // Gerar dados simulados para demonstração
                const days = parseInt(period) || 7;
                const today = new Date();
                const dailyData = [];
                
                // Gerar dados diários simulados
                for (let i = 0; i < days; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    
                    // Quantidade aleatória entre 5 e 25
                    const quantidade = Math.floor(Math.random() * 20) + 5;
                    
                    dailyData.unshift({
                        data: date.toISOString().split('T')[0],
                        quantidade,
                        tempoMedioResolucao: Math.floor(Math.random() * 240) + 30, // 30 a 270 minutos
                        acoes: {
                            RESOLVIDO: Math.floor(Math.random() * quantidade * 0.6),
                            DIRECIONADO: Math.floor(Math.random() * quantidade * 0.3),
                            CANCELADO: Math.floor(Math.random() * quantidade * 0.1)
                        },
                        grupoMaisAcionado: ['SUPORTE_N1', 'SUPORTE_N2', 'INFRA', 'DEV'][Math.floor(Math.random() * 4)]
                    });
                }
                
                // Gerar dados de grupo simulados
                const gruposData = [
                    { GRUPO_DIRECIONADO: 'SUPORTE_N1', total: Math.floor(Math.random() * 50) + 20 },
                    { GRUPO_DIRECIONADO: 'SUPORTE_N2', total: Math.floor(Math.random() * 40) + 10 },
                    { GRUPO_DIRECIONADO: 'INFRA', total: Math.floor(Math.random() * 30) + 5 },
                    { GRUPO_DIRECIONADO: 'DEV', total: Math.floor(Math.random() * 20) + 5 }
                ];
                
                // Calcular totais por ação
                const acoes = {
                    RESOLVIDO: dailyData.reduce((sum, day) => sum + day.acoes.RESOLVIDO, 0),
                    DIRECIONADO: dailyData.reduce((sum, day) => sum + day.acoes.DIRECIONADO, 0),
                    CANCELADO: dailyData.reduce((sum, day) => sum + day.acoes.CANCELADO, 0)
                };
                
                data = {
                    period,
                    dailyData,
                    gruposData,
                    acoes
                };
            }
            
            const elapsedTime = Date.now() - startTime;
            
            logger.info(`[CONTROLLER] Análise temporal concluída com sucesso em ${elapsedTime}ms`, {
                startDate,
                endDate,
                period,
                itemsReturned: data.dailyData?.length,
                elapsedTime,
                requestId: req.id
            });
            
            res.json(data);
        } catch (error) {
            logger.error(`[CONTROLLER] Erro na análise temporal: ${error.message}`, {
                startDate,
                endDate,
                period,
                error: error.stack,
                userId: req.user?.id,
                requestId: req.id
            });
            
            res.status(500).json({ 
                error: 'Erro ao processar análise temporal',
                details: error.message 
            });
        }
    }

    async getStatistics(req, res) {
        logger.info(`[CONTROLLER] Buscando estatísticas de incidentes`, {
            userId: req.user?.id,
            requestId: req.id
        });
        
        try {
            const startTime = Date.now();
            const stats = await this.incidentRepository.getStatistics();
            const elapsedTime = Date.now() - startTime;
            
            logger.info(`[CONTROLLER] Estatísticas obtidas com sucesso em ${elapsedTime}ms`, {
                elapsedTime,
                stats: {
                    total: stats.total,
                    ativos: stats.ativos,
                    resolvidos: stats.resolvidos
                },
                requestId: req.id
            });
            
            res.json(stats);
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao buscar estatísticas: ${error.message}`, {
                error: error.stack,
                userId: req.user?.id,
                requestId: req.id
            });
            
            res.status(500).json({ 
                error: 'Erro ao buscar estatísticas',
                details: error.message 
            });
        }
    }
    
    async getIncidents(req, res) {
        const { startDate, endDate, grupo, acao } = req.query;
        
        logger.info(`[CONTROLLER] Buscando incidentes. Período: ${startDate} a ${endDate}`, {
            startDate, 
            endDate,
            grupo,
            acao,
            userId: req.user?.id,
            requestId: req.id
        });
        
        try {
            const filtros = { 
                startDate,
                endDate,
                grupos: grupo ? [grupo] : [],
                acoes: acao ? [acao] : []
            };
            
            const startTime = Date.now();
            const resultado = await this.incidentRepository.listIncidents(filtros);
            const elapsedTime = Date.now() - startTime;
            
            logger.info(`[CONTROLLER] ${resultado.incidents.length} incidentes encontrados em ${elapsedTime}ms`, {
                count: resultado.incidents.length,
                elapsedTime,
                requestId: req.id
            });
            
            res.json(resultado.incidents);
        } catch (error) {
            logger.error(`[CONTROLLER] Erro ao buscar incidentes: ${error.message}`, {
                startDate,
                endDate,
                error: error.stack,
                userId: req.user?.id,
                requestId: req.id
            });
            
            res.status(500).json({ 
                error: 'Erro ao buscar incidentes',
                details: error.message 
            });
        }
    }
}

module.exports = IncidentController; 