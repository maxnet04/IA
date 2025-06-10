const HistoricalDataRepository = require('../repositories/HistoricalDataRepository');
const PredictiveAnalysisService = require('../services/PredictiveAnalysisService');
const { Parser } = require('json2csv');

/**
 * Controlador para análise preditiva
 */
class PredictiveAnalysisController {
    constructor(historicalDataRepository, predictionHistoryRepository) {
        this.historicalDataRepository = historicalDataRepository || new HistoricalDataRepository();
        this.predictiveService = new PredictiveAnalysisService(this.historicalDataRepository);
    }

    /**
     * Obtém previsão de volume para um produto em uma data específica
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async getPredictedVolume(req, res) {
        try {
            const { date, productId } = req.query;

            if (!date || !productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetros date e productId são obrigatórios'
                });
            }

            const prediction = await this.predictiveService.predictVolume(date, productId);
            return res.status(200).json({
                success: true,
                data: prediction
            });
        } catch (error) {
            console.error('Erro ao obter previsão de volume:', error);
            // Verifica se é erro de dados insuficientes e retorna mensagem específica
            if (error.message && error.message.includes('Dados históricos insuficientes')) {
                return res.status(400).json({
                    success: false,
                    error: 'Erro ao obter previsão de volume',
                    details: error.message,
                    suggestion: 'Tente outro produto ou adicione mais dados históricos'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro ao obter previsão de volume',
                details: error.message
            });
        }
    }

    /**
     * Detecta anomalias nos dados históricos
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async detectAnomalies(req, res) {
        try {
            const { productId, startDate, endDate, severity, limit } = req.query;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro productId é obrigatório'
                });
            }

            // Log para depuração
            console.log(`Detectando anomalias para: productId=${productId}, startDate=${startDate}, endDate=${endDate}, severity=${severity}, limit=${limit}`);

            const anomalies = await this.predictiveService.detectAnomalies(productId, startDate, endDate, severity, limit);
            return res.status(200).json({
                success: true,
                data: anomalies
            });
        } catch (error) {
            console.error('Erro ao detectar anomalias:', error);
            
            // Verifica se é erro de dados insuficientes e retorna mensagem específica
            if (error.message && error.message.includes('Dados históricos insuficientes')) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados insuficientes para análise de anomalias',
                    details: error.message,
                    suggestion: 'Tente outro produto com mais histórico ou aguarde a coleta de mais dados'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro ao detectar anomalias',
                details: error.message
            });
        }
    }

    /**
     * Gera recomendações baseadas nas análises
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async getRecommendations(req, res) {
        try {
            const { productId } = req.query;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro productId é obrigatório'
                });
            }

            const recommendations = await this.predictiveService.generateRecommendations(productId);
            return res.status(200).json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            console.error('Erro ao gerar recomendações:', error);
            
            // Verifica se é erro de dados insuficientes e retorna mensagem específica
            if (error.message && error.message.includes('Dados históricos insuficientes')) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados insuficientes para gerar recomendações',
                    details: error.message,
                    suggestion: 'Tente outro produto com mais histórico ou aguarde a coleta de mais dados'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro ao gerar recomendações',
                details: error.message
            });
        }
    }

    /**
     * Obtém métricas detalhadas para um produto
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async getDetailedMetrics(req, res) {
        try {
            const { productId, startDate, endDate } = req.query;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro productId é obrigatório'
                });
            }

            const metrics = await this.predictiveService.getMetrics(productId, startDate, endDate);
            return res.status(200).json({
                success: true,
                data: metrics
            });
        } catch (error) {
            console.error('Erro ao obter métricas:', error);
            
            // Verifica se é erro de dados insuficientes e retorna mensagem específica
            if (error.message && error.message.includes('Dados históricos insuficientes')) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados insuficientes para calcular métricas',
                    details: error.message,
                    suggestion: 'Tente outro produto com mais histórico ou aguarde a coleta de mais dados'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro ao obter métricas',
                details: error.message
            });
        }
    }

    /**
     * Exporta dados de análise em formato CSV
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async exportData(req, res) {
        try {
            const { type } = req.params;
            const { productId, startDate, endDate } = req.query;

            if (!productId) {
                return res.status(400).json({ 
                    message: 'ID do produto é obrigatório' 
                });
            }

            let data;
            try {
                switch (type) {
                    case 'anomalies':
                        data = await this.predictiveService.detectAnomalies(productId, startDate, endDate);
                        break;
                    case 'recommendations':
                        data = await this.predictiveService.generateRecommendations(productId);
                        break;
                    case 'metrics':
                        data = await this.predictiveService.getMetrics(productId, startDate, endDate);
                        break;
                    default:
                        return res.status(400).json({ 
                            message: 'Tipo de exportação inválido' 
                        });
                }
            } catch (serviceError) {
                // Captura erro de dados insuficientes
                if (serviceError.message && serviceError.message.includes('Dados históricos insuficientes')) {
                    return res.status(400).json({
                        success: false,
                        message: `Dados insuficientes para exportar ${type}`,
                        details: serviceError.message,
                        suggestion: 'Tente outro produto com mais histórico ou aguarde a coleta de mais dados'
                    });
                }
                throw serviceError; // Re-lança o erro para ser capturado pelo catch externo
            }

            if (!data || (Array.isArray(data) && data.length === 0)) {
                return res.status(404).json({ 
                    message: 'Nenhum dado encontrado para exportação' 
                });
            }

            // Converte os dados para CSV
            const fields = Object.keys(Array.isArray(data) ? data[0] : data);
            const parser = new Parser({ fields });
            const csv = parser.parse(Array.isArray(data) ? data : [data]);

            // Configura o cabeçalho para download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_${productId}_${new Date().toISOString()}.csv`);

            return res.send(csv);
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            return res.status(500).json({ 
                message: 'Erro ao exportar dados',
                error: error.message 
            });
        }
    }

    /**
     * Obtém histórico de previsões para um produto
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async getPredictionHistory(req, res) {
        try {
            const { productId, startDate, endDate } = req.query;
            
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro productId é obrigatório'
                });
            }
            
            const history = await this.predictiveService.getPredictionHistory(productId, startDate, endDate);
            return res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Erro ao obter histórico de previsões:', error);
            return res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * Marca uma notificação como lida
     * @param {Object} req - Request do Express
     * @param {Object} res - Response do Express
     */
    async markNotificationAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            
            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID da notificação é obrigatório'
                });
            }
            
            const result = await this.predictiveService.markNotificationAsRead(notificationId);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ 
                    success: false,
                    error: error.message 
                });
            } else {
                return res.status(500).json({ 
                    success: false,
                    error: error.message 
                });
            }
        }
    }

    /**
     * Obtém análise completa de volume com histórico e previsões
     * @param {Object} req Request
     * @param {Object} res Response
     */
    async getVolumeAnalysis(req, res) {
        try {
            const { productId, targetDate, monthsBack = 3, monthsForward = 2 } = req.query;
            
            if (!productId || !targetDate) {
                return res.status(400).json({
                    success: false,
                    error: 'productId e targetDate são obrigatórios'
                });
            }

            const daysForward = parseInt(monthsForward);
            
            const historicalData = await this.predictiveService.getVolumeHistory(
                productId,
                targetDate,
                monthsBack
            );
            
            // Usar o novo método de previsão com ensemble
            const rawPredictions = await this.predictiveService.getPredictionsWithEnsemble(
                productId,
                targetDate,
                daysForward
            );
            
            // Calcular previsões retroativas para dados históricos
            const calcularPrevisaoRetroativa = (dados, indice) => {
                if (indice < 7) return {
                    volume: dados[indice].volume,
                    confidence: 0.5 // Confiança média para poucos dados
                };
                
                // Usar dados anteriores para calcular a previsão
                const dadosAnteriores = dados.slice(Math.max(0, indice - 7), indice);
                
                // Calcular média móvel
                const mediaMovel = dadosAnteriores.reduce((sum, item) => sum + item.volume, 0) / dadosAnteriores.length;
                
                // Calcular tendência simples
                const trend = this.calculateSimpleTrend(dadosAnteriores);
                
                // Calcular variabilidade para determinar confiança
                const volumes = dadosAnteriores.map(d => d.volume);
                const variancia = this.calculateVariance(volumes);
                const coefVariacao = Math.sqrt(variancia) / mediaMovel;
                const confidence = Math.max(0.3, Math.min(0.9, 1 - coefVariacao));
                
                // Aplicar modelo simples: média móvel + tendência
                return {
                    volume: Math.round(mediaMovel * (1 + trend)),
                    confidence: parseFloat(confidence.toFixed(2))
                };
            };

            // Formatar dados históricos com previsão retroativa
            const historicalDataArray = [...historicalData];
            const formattedHistorical = historicalDataArray.map((h, index) => {
                const previsao = calcularPrevisaoRetroativa(historicalDataArray, index);
                return {
                    date: h.date.split('T')[0], // Formato YYYY-MM-DD
                    volume: Number(h.volume),
                    predictedVolume: Number(previsao.volume),
                    confidence: previsao.confidence
                };
            });
            
            // Formatar previsões no formato desejado
            const formattedPredictions = rawPredictions.map(p => ({
                date: p.date.split('T')[0], // Formato YYYY-MM-DD
                predictedVolume: Number(p.predictedVolume || 0), // Usar p.predictedVolume em vez de p.volume e garantir não-nulo
                confidence: Number(p.confidence) / 100 // Converter para decimal (0-1)
            }));
            
            // Calcular tendência com base nos volumes históricos
            const volumes = formattedHistorical.map(h => h.volume);
            const lastIndex = volumes.length - 1;
            const trend = lastIndex > 0 
                ? (volumes[lastIndex] - volumes[0]) / volumes[0]
                : 0;
            
            return res.json({
                success: true,
                data: {
                    historical: formattedHistorical,
                    predictions: formattedPredictions,
                    metadata: {
                        trend: Number(trend.toFixed(2)),
                        calculatedAt: new Date().toISOString(),
                        dataQuality: historicalData.length >= 3 ? 'high' : 'low',
                        isAggregate: productId === 'ALL'
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao obter análise de volume:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao processar análise de volume',
                details: error.message
            });
        }
    }

    /**
     * Formata os dados históricos e previstos para visualização em gráfico
     * @param {Array} historicalData Dados históricos
     * @param {Array} predictions Previsões
     * @returns {Array} Série temporal unificada com dados históricos e previstos
     * @private
     */
    formatDataForChart(historicalData, predictions) {
        // Combinar todas as datas (histórico e previsão) em uma única linha do tempo
        const allDates = [
            ...historicalData.map(h => h.date),
            ...predictions.map(p => p.date)
        ].sort();

        // Criar um objeto que mapeia cada data para um objeto de dados completo
        const dataByDate = {};
        
        // Inicializar com valores vazios (null) para todas as datas
        allDates.forEach(date => {
            dataByDate[date] = { 
                date, 
                volume: null,         // Para dados históricos 
                predictedVolume: null, // Para dados previstos
                confidence: null,      // Confiança da previsão
                type: null             // Tipo do dado: 'historical' ou 'prediction'
            };
        });
        
        // Preencher com dados históricos
        historicalData.forEach(item => {
            if (dataByDate[item.date]) {
                dataByDate[item.date].volume = item.volume;
                dataByDate[item.date].type = 'historical';
            }
        });
        
        // Preencher com dados previstos para datas futuras
        predictions.forEach(item => {
            if (dataByDate[item.date]) {
                dataByDate[item.date].predictedVolume = item.volume;
                dataByDate[item.date].confidence = item.confidence;
                if (!dataByDate[item.date].volume) { // Se não tiver volume real, é uma previsão futura
                    dataByDate[item.date].type = 'prediction';
                }
            }
        });
        
        // Calcular previsões retroativas para datas históricas
        // Isso nos permite comparar o que o modelo teria previsto vs. o que realmente aconteceu
        this.calculateRetroactivePredictions(dataByDate, historicalData);
        
        // Converter de volta para array e ordenar por data
        return Object.values(dataByDate).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
    }
    
    /**
     * Calcula previsões retroativas para datas históricas
     * Isso permite comparar valores reais com o que o modelo teria previsto
     * @param {Object} dataByDate Mapa de dados por data
     * @param {Array} historicalData Dados históricos
     * @private
     */
    calculateRetroactivePredictions(dataByDate, historicalData) {
        if (historicalData.length < 7) return; // Precisamos de pelo menos 7 dias para calcular
        
        // Para cada data no mapa, se for um dado histórico, calcular o que teria sido previsto
        const historicalDates = historicalData.map(h => h.date).sort();
        
        // Começar do 8º dia, pois precisamos de 7 dias anteriores para calcular a média móvel
        for (let i = 7; i < historicalDates.length; i++) {
            const targetDate = historicalDates[i];
            const item = dataByDate[targetDate];
            
            if (item && item.type === 'historical') {
                // Obter os 7 dias anteriores (para média móvel)
                const previousDates = historicalDates.slice(i-7, i);
                const previousData = previousDates.map(date => dataByDate[date]);
                
                // Calcular média móvel simples (como uma simulação do que o modelo teria previsto)
                const avgVolume = previousData.reduce((sum, data) => sum + data.volume, 0) / previousData.length;
                
                // Calcular tendência dos dados anteriores
                const trend = this.calculateSimpleTrend(previousData);
                
                // Aplicar o modelo simplificado (média móvel + tendência)
                const predictedVolume = Math.round(avgVolume * (1 + trend));
                
                // Calcular confiança simulada baseada no erro relativo
                // (maior variabilidade = menor confiança)
                const variance = this.calculateVariance(previousData.map(d => d.volume));
                const meanVolume = avgVolume;
                const coeffOfVariation = Math.sqrt(variance) / meanVolume;
                const confidence = Math.max(0.3, Math.min(0.9, 1 - coeffOfVariation));
                
                // Atualizar os campos
                item.predictedVolume = predictedVolume;
                item.confidence = parseFloat(confidence.toFixed(2));
            }
        }
    }
    
    /**
     * Calcula uma tendência simples dos dados históricos
     * @param {Array} data Dados históricos ordenados por data
     * @returns {Number} Valor da tendência (ex: 0.05 = aumento de 5%)
     * @private
     */
    calculateSimpleTrend(data) {
        if (data.length < 2) return 0;
        
        // Calcular diferença percentual média entre pontos consecutivos
        let totalPercentChange = 0;
        
        for (let i = 1; i < data.length; i++) {
            const prevVolume = data[i-1].volume;
            const currVolume = data[i].volume;
            
            if (prevVolume > 0) {
                const percentChange = (currVolume - prevVolume) / prevVolume;
                totalPercentChange += percentChange;
            }
        }
        
        // Calcular média das variações percentuais
        const avgPercentChange = totalPercentChange / (data.length - 1);
        
        // Limitar a tendência entre -20% e 20% para evitar extremos
        return Math.max(-0.2, Math.min(0.2, avgPercentChange));
    }
    
    /**
     * Calcula a variância de um conjunto de dados
     * @param {Array} data Array de números
     * @returns {number} Variância calculada
     * @private
     */
    calculateVariance(data) {
        if (data.length <= 1) return 0;
        
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const squareDiffs = data.map(val => Math.pow(val - mean, 2));
        return squareDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    }

    /**
     * Realiza backtesting das previsões, comparando previsões retroativas com dados reais
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async performBacktesting(req, res) {
        try {
            const { productId, startDate, endDate, lookbackPeriod = 7 } = req.query;

            if (!productId || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetros productId, startDate e endDate são obrigatórios'
                });
            }

            // Obter dados históricos para o período especificado
            const historicalData = await this.historicalDataRepository.getByProductId(
                productId, 
                startDate, 
                endDate
            );

            if (historicalData.length < lookbackPeriod + 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados históricos insuficientes para backtesting',
                    details: `São necessários pelo menos ${lookbackPeriod + 5} pontos de dados para realizar o backtesting.`
                });
            }

            // Ordenar dados por data
            historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Resultados do backtesting
            const backtestingResults = [];
            
            // Realizar backtesting para cada data após o período mínimo
            for (let i = lookbackPeriod; i < historicalData.length; i++) {
                const targetDate = historicalData[i].date;
                // Dados históricos até a data alvo (excluindo a própria data alvo)
                const trainingData = historicalData.slice(0, i);
                
                // Aplicar o modelo de previsão aos dados de treinamento
                const predictedVolume = this.calculaPrevisaoRetroativa(
                    trainingData, 
                    lookbackPeriod,
                    new Date(targetDate)
                );
                
                const actualVolume = historicalData[i].volume;
                const error = actualVolume - predictedVolume;
                const errorPercentage = (error / actualVolume) * 100;
                
                backtestingResults.push({
                    date: targetDate,
                    actualVolume,
                    predictedVolume,
                    error,
                    errorPercentage: parseFloat(errorPercentage.toFixed(2)),
                    lookbackPeriod
                });
            }
            
            // Calcular métricas de performance
            const errors = backtestingResults.map(r => r.error);
            const absErrors = errors.map(Math.abs);
            const percentErrors = backtestingResults.map(r => Math.abs(r.errorPercentage));
            
            const mae = this.calculateMean(absErrors);
            const mape = this.calculateMean(percentErrors);
            const rmse = Math.sqrt(this.calculateMean(errors.map(e => e * e)));
            
            return res.status(200).json({
                success: true,
                data: {
                    backtestingResults,
                    performanceMetrics: {
                        mae: parseFloat(mae.toFixed(2)),
                        mape: parseFloat(mape.toFixed(2)),
                        rmse: parseFloat(rmse.toFixed(2))
                    },
                    metadata: {
                        productId,
                        startDate,
                        endDate,
                        lookbackPeriod,
                        totalSamples: backtestingResults.length
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao realizar backtesting:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao realizar backtesting',
                details: error.message
            });
        }
    }

    /**
     * Calcula uma previsão retroativa usando dados históricos até certo ponto
     * @param {Array} historicalData Dados históricos
     * @param {Number} lookbackPeriod Período de olhar para trás (dias)
     * @param {Date} targetDate Data alvo para previsão
     * @returns {Number} Volume previsto
     * @private
     */
    calculaPrevisaoRetroativa(historicalData, lookbackPeriod, targetDate) {
        // Usar apenas os últimos 'lookbackPeriod' dias para a previsão
        const relevantData = historicalData.slice(-lookbackPeriod);
        
        // Calcular média móvel simples
        const avgVolume = this.calculateMean(relevantData.map(d => d.volume));
        
        // Calcular tendência dos dados anteriores
        const trend = this.calculateSimpleTrend(relevantData);
        
        // Aplicar ajuste sazonal se houver dados suficientes
        let seasonalFactor = 1;
        if (historicalData.length >= 30) {
            const targetMonth = targetDate.getMonth();
            seasonalFactor = this.calculateSeasonalFactor(historicalData, targetMonth);
        }
        
        // Aplicar o modelo: média móvel + tendência + sazonalidade
        return Math.round(avgVolume * (1 + trend) * seasonalFactor);
    }

    /**
     * Calcula o fator sazonal para um determinado mês
     * @param {Array} data Dados históricos
     * @param {Number} monthIndex Índice do mês (0-11)
     * @returns {Number} Fator sazonal
     * @private
     */
    calculateSeasonalFactor(data, monthIndex) {
        // Agrupar volumes por mês
        const volumesByMonth = Array(12).fill().map(() => []);
        
        data.forEach(item => {
            const date = new Date(item.date);
            const month = date.getMonth();
            volumesByMonth[month].push(item.volume);
        });
        
        // Calcular média de todos os volumes
        const allVolumes = data.map(item => item.volume);
        const overallMean = this.calculateMean(allVolumes);
        
        if (overallMean === 0) return 1;
        
        // Calcular média mensal
        const monthVolumes = volumesByMonth[monthIndex];
        if (monthVolumes.length === 0) return 1;
        
        const monthMean = this.calculateMean(monthVolumes);
        
        // Calcular fator sazonal
        const seasonalFactor = monthMean / overallMean;
        
        // Limitar o fator sazonal entre 0.7 e 1.3 para evitar extremos
        return Math.max(0.7, Math.min(1.3, seasonalFactor));
    }

    /**
     * Calcula a média de um array de números
     * @param {Array} data Array de números
     * @returns {Number} Média
     * @private
     */
    calculateMean(data) {
        if (data.length === 0) return 0;
        return data.reduce((sum, val) => sum + val, 0) / data.length;
    }
}

module.exports = PredictiveAnalysisController; 