const IncidentRepository = require('../repositories/IncidentRepository');
const logger = require('../utils/logger');

class IncidentService {
    constructor() {
        this.incidentRepository = new IncidentRepository();
        logger.info('[SERVICE] IncidentService inicializado');
    }

    /**
     * Obtém dados para análise temporal de incidentes
     * @param {string} startDate - Data inicial
     * @param {string} endDate - Data final
     * @param {string} period - Período de análise ('7d', '15d', '30d', '90d')
     * @param {string} group - Grupo para filtrar
     * @returns {Promise<Object>} Dados de análise temporal
     */
    async getTimelineAnalysis(startDate, endDate, period = '7d', group = '') {
        logger.info(`[SERVICE] Iniciando análise temporal`, { startDate, endDate, period, group });
        
        let finalStartDate, finalEndDate;

        // Se startDate e endDate foram fornecidos, use-os
        if (startDate && endDate) {
            finalStartDate = new Date(startDate);
            finalEndDate = new Date(endDate);
        } else {
            // Caso contrário, use o período
            const days = parseInt(period);
            finalEndDate = new Date();
            finalStartDate = new Date();
            finalStartDate.setDate(finalStartDate.getDate() - days);
        }

        logger.debug(`[SERVICE] Buscando incidentes entre ${finalStartDate.toISOString()} e ${finalEndDate.toISOString()}`);
        
        const startTime = Date.now();
        const incidents = await this.incidentRepository.findByDateRange(
            finalStartDate, 
            finalEndDate,
            group ? [group] : [],
            []
        );
        const repositoryTime = Date.now() - startTime;
        
        logger.debug(`[SERVICE] Encontrados ${incidents.length} incidentes em ${repositoryTime}ms`);
        
        // Agrupa incidentes por dia
        const processingStart = Date.now();
        const dailyData = this._groupIncidentsByDay(incidents, finalStartDate, finalEndDate);
        
        logger.debug(`[SERVICE] Agrupando incidentes por dia (${dailyData.length} dias)`);
        
        const gruposData = await this.incidentRepository.getIncidentesPorGrupo(
            finalStartDate,
            finalEndDate,
            group ? [group] : [],
            []
        );
        
        const processingTime = Date.now() - processingStart;
        const totalTime = Date.now() - startTime;
        
        logger.info(`[SERVICE] Análise temporal concluída em ${totalTime}ms (Repositório: ${repositoryTime}ms, Processamento: ${processingTime}ms)`, {
            startDate: finalStartDate,
            endDate: finalEndDate,
            period,
            group,
            incidentsCount: incidents.length,
            daysCount: dailyData.length,
            groupsCount: gruposData.length,
            executionTime: {
                total: totalTime,
                repository: repositoryTime,
                processing: processingTime
            }
        });
        
        return {
            period,
            dailyData,
            gruposData,
            acoes: this._getAcoesBreakdown(incidents)
        };
    }

    /**
     * Obtém estatísticas gerais de incidentes
     * @param {Object} filtros - Filtros a serem aplicados
     * @returns {Promise<Object>} Estatísticas gerais
     */
    async getStatistics(filtros = { grupos: [], acoes: [] }) {
        logger.info(`[SERVICE] Obtendo estatísticas gerais de incidentes`, { filtros });
        
        const startTime = Date.now();
        const stats = await this.incidentRepository.getStatistics(filtros.grupos, filtros.acoes);
        const elapsedTime = Date.now() - startTime;
        
        logger.info(`[SERVICE] Estatísticas obtidas em ${elapsedTime}ms`, {
            executionTime: elapsedTime,
            stats: {
                total: stats.total,
                ativos: stats.ativos,
                resolvidos: stats.resolvidos
            }
        });
        
        return stats;
    }
    
    /**
     * Busca incidentes com base em filtros
     * @param {string} startDate - Data inicial
     * @param {string} endDate - Data final
     * @param {Object} filtros - Filtros a serem aplicados
     * @returns {Promise<Array>} Lista de incidentes
     */
    async findIncidents(startDate, endDate, filtros = { grupos: [], acoes: [] }) {
        logger.info(`[SERVICE] Buscando incidentes por período e filtros`, {
            startDate,
            endDate,
            filtros
        });
        
        if (!startDate || !endDate) {
            logger.warn(`[SERVICE] Datas inválidas para busca de incidentes`, { startDate, endDate });
            throw new Error('As datas de início e fim são obrigatórias');
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            logger.warn(`[SERVICE] Formato de data inválido`, { startDate, endDate });
            throw new Error('Formato de data inválido');
        }
        
        if (start > end) {
            logger.warn(`[SERVICE] Data inicial maior que data final`, { startDate, endDate });
            throw new Error('A data inicial não pode ser maior que a data final');
        }
        
        const startTime = Date.now();
        const incidents = await this.incidentRepository.findByDateRange(
            start,
            end,
            filtros.grupos,
            filtros.acoes
        );
        const elapsedTime = Date.now() - startTime;
        
        logger.info(`[SERVICE] ${incidents.length} incidentes encontrados em ${elapsedTime}ms`, {
            count: incidents.length,
            executionTime: elapsedTime
        });
        
        return incidents;
    }

    /**
     * Agrupa incidentes por dia e calcula métricas
     * @private
     */
    _groupIncidentsByDay(incidents, startDate, endDate) {
        logger.debug(`[SERVICE] Agrupando ${incidents.length} incidentes por dia`);
        
        const dailyData = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayIncidents = incidents.filter(incident => {
                const incidentDate = new Date(incident.DATA_CRIACAO);
                return incidentDate.toDateString() === currentDate.toDateString();
            });

            const tempoMedioResolucao = this._calculateAverageResolutionTime(dayIncidents);
            const acoesBreakdown = this._getAcoesBreakdown(dayIncidents);

            dailyData.push({
                data: currentDate.toISOString().split('T')[0],
                quantidade: dayIncidents.length,
                tempoMedioResolucao,
                acoes: acoesBreakdown,
                grupoMaisAcionado: this._getMostCommonGroup(dayIncidents)
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        logger.debug(`[SERVICE] Agrupamento finalizado. Gerados ${dailyData.length} registros diários`);
        
        return dailyData;
    }

    /**
     * Calcula o tempo médio de resolução dos incidentes
     * @private
     */
    _calculateAverageResolutionTime(incidents) {
        if (!incidents.length) return 0;

        const totalTime = incidents.reduce((sum, incident) => {
            if (!incident.DATA_ENCERRAMENTO) return sum;
            
            const criacao = new Date(incident.DATA_CRIACAO);
            const encerramento = new Date(incident.DATA_ENCERRAMENTO);
            const diffMinutes = (encerramento - criacao) / (1000 * 60);
            
            return sum + diffMinutes;
        }, 0);

        return Math.round(totalTime / incidents.length);
    }

    /**
     * Obtém o breakdown de ações tomadas nos incidentes
     * @private
     */
    _getAcoesBreakdown(incidents) {
        const acoes = {
            RESOLVIDO: 0,
            DIRECIONADO: 0,
            CANCELADO: 0
        };

        incidents.forEach(incident => {
            if (incident.ACAO) {
                acoes[incident.ACAO]++;
            }
        });

        return acoes;
    }

    /**
     * Obtém o grupo mais acionado no período
     * @private
     */
    _getMostCommonGroup(incidents) {
        if (!incidents.length) return null;

        const grupos = {};
        incidents.forEach(incident => {
            if (incident.GRUPO_DIRECIONADO) {
                grupos[incident.GRUPO_DIRECIONADO] = (grupos[incident.GRUPO_DIRECIONADO] || 0) + 1;
            }
        });

        return Object.entries(grupos)
            .sort(([,a], [,b]) => b - a)
            .map(([grupo]) => grupo)[0] || null;
    }
}

module.exports = IncidentService; 