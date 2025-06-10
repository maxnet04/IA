const HistoricalDataRepository = require('../repositories/HistoricalDataRepository');
const logger = require('../utils/logger');
const { predictLinearRegression, predictARIMA, predictMovingAverage } = require('../utils/predictionAlgorithms');

/**
 * Serviço para análise preditiva
 */
class PredictiveAnalysisService {
    constructor(historicalDataRepository) {
        this.historicalDataRepository = historicalDataRepository || new HistoricalDataRepository();
        this.algorithms = {
            linearRegression: predictLinearRegression,
            arima: predictARIMA,
            movingAverage: predictMovingAverage
        };

        logger.info('[SERVICE] Inicializando PredictiveAnalysisService');
        this.MIN_HISTORICAL_DATA = 30; // Mínimo de dias necessários para análise
        this.init();
    }

    async init() {
        try {
            // Chamar init apenas se o método existir
            if (typeof this.historicalDataRepository.init === 'function') {
                await this.historicalDataRepository.init();
                logger.info('[SERVICE] Repositório de dados históricos inicializado com sucesso');
            } else {
                logger.info('[SERVICE] Método init não encontrado no repositório, continuando sem inicialização');
            }
        } catch (error) {
            logger.error(`[SERVICE] Erro ao inicializar repositório: ${error.message}`, { 
                error: error.stack 
            });
            console.error('Erro ao inicializar repositório:', error);
        }
    }

    async predictVolume(date, productId) {
        try {
            const historicalData = await this.historicalDataRepository.getHistoricalData(productId);
            
            // Verificação especial para o produto "ALL" - permite funcionar com menos dados
            if (productId === 'ALL' && historicalData.length > 0) {
                console.log(`Usando ${historicalData.length} registros disponíveis para o produto ALL`);
                
                // Gera uma previsão simplificada baseada nos dados disponíveis
                const prediction = this._calculatePredictionWithLimitedData(historicalData);
                const trend = this._calculateTrend(historicalData);
                return {
                    date,
                    predictedVolume: prediction,
                    confidence: Math.max(0.2, historicalData.length / this.MIN_HISTORICAL_DATA), // Confiança proporcional
                    trend: trend,
                    warning: historicalData.length < this.MIN_HISTORICAL_DATA ? 
                        `Dados históricos limitados (${historicalData.length}/${this.MIN_HISTORICAL_DATA} dias recomendados)` : null
                };
            }
            
            // Validação normal para outros produtos
            if (historicalData.length < this.MIN_HISTORICAL_DATA) {
                throw new Error(`Dados históricos insuficientes para o produto ${productId}. Necessário pelo menos ${this.MIN_HISTORICAL_DATA} dias.`);
            }

            const prediction = this._calculatePrediction(historicalData);
            const trend = this._calculateTrend(historicalData);
            return {
                date,
                predictedVolume: prediction,
                confidence: this._calculateConfidence(historicalData),
                trend: trend
            };
        } catch (error) {
            console.error(`Erro ao prever volume para o produto ${productId}:`, error);
            throw error;
        }
    }

    async detectAnomalies(productId, startDate, endDate, severity, limit) {
        try {
            console.log(`Service - Detectando anomalias: productId=${productId}, startDate=${startDate}, endDate=${endDate}, severity=${severity}, limit=${limit}`);
            
            // Ajustar o período se não for fornecido
            if (!startDate) {
                // Se não há data inicial, usa 30 dias atrás
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                startDate = thirtyDaysAgo.toISOString().split('T')[0];
                console.log(`Data inicial não fornecida, usando padrão: ${startDate}`);
            }
            
            if (!endDate) {
                // Se não há data final, usa hoje
                const today = new Date();
                endDate = today.toISOString().split('T')[0];
                console.log(`Data final não fornecida, usando padrão: ${endDate}`);
            }
            
            const historicalData = await this.historicalDataRepository.getHistoricalData(productId, startDate, endDate);
            console.log(`Encontrados ${historicalData.length} registros históricos para o produto ${productId}`);
            
            // Tratamento especial para o agregado 'ALL'
            if (productId === 'ALL') {
                // Para 'ALL', vamos prosseguir com os dados disponíveis
                if (historicalData.length === 0) {
                    return {
                        anomalies: [],
                        threshold: 0,
                        period: { startDate, endDate },
                        warning: 'Nenhum dado histórico encontrado para análise agregada.'
                    };
                }

                // Mesmo com poucos dados, tentamos fazer a análise para o agregado
                const { anomalies, threshold } = this._detectAnomalies(historicalData);
                console.log(`Detectadas ${anomalies.length} anomalias para o agregado ALL`);

                let filteredAnomalies = anomalies;
                if (severity) {
                    filteredAnomalies = anomalies.filter(anomaly => 
                        anomaly.severity && 
                        anomaly.severity.toLowerCase() === severity.toLowerCase()
                    );
                }

                if (limit && !isNaN(parseInt(limit))) {
                    filteredAnomalies = filteredAnomalies.slice(0, parseInt(limit));
                }

                return {
                    anomalies: filteredAnomalies,
                    threshold,
                    period: { startDate, endDate },
                    warning: historicalData.length < this.MIN_HISTORICAL_DATA ? 
                        `Análise agregada realizada com dados limitados (${historicalData.length}/${this.MIN_HISTORICAL_DATA} dias recomendados).` : 
                        undefined
                };
            }

            // Verificação para produtos individuais
            if (historicalData.length === 0) {
                throw new Error(`Nenhum dado histórico encontrado para o produto ${productId} no período especificado.`);
            }

            if (historicalData.length < this.MIN_HISTORICAL_DATA) {
                return {
                    anomalies: [],
                    threshold: this._calculateBasicThreshold(historicalData),
                    period: { startDate, endDate },
                    warning: `Dados históricos limitados (${historicalData.length}/${this.MIN_HISTORICAL_DATA} dias recomendados). Análise de anomalias pode não ser precisa.`
                };
            }

            const { anomalies, threshold } = this._detectAnomalies(historicalData);
            console.log(`Detectadas ${anomalies.length} anomalias para o produto ${productId}`);
            
            let filteredAnomalies = anomalies;
            if (severity) {
                console.log(`Filtrando anomalias por severidade: ${severity}`);
                filteredAnomalies = anomalies.filter(anomaly => 
                    anomaly.severity && 
                    anomaly.severity.toLowerCase() === severity.toLowerCase()
                );
                console.log(`${filteredAnomalies.length} anomalias após filtro de severidade`);
            }
            
            if (limit && !isNaN(parseInt(limit))) {
                const limitNumber = parseInt(limit);
                console.log(`Limitando a ${limitNumber} anomalias`);
                filteredAnomalies = filteredAnomalies.slice(0, limitNumber);
                console.log(`${filteredAnomalies.length} anomalias após aplicar limite`);
            }
            
            return {
                anomalies: filteredAnomalies,
                threshold,
                period: { startDate, endDate }
            };
        } catch (error) {
            console.error(`Erro ao detectar anomalias para o produto ${productId}:`, error);
            throw error;
        }
    }

    async generateRecommendations(productId) {
        try {
            const historicalData = await this.historicalDataRepository.getHistoricalData(productId);
            
            // Verificação especial para produtos com dados insuficientes
            if (historicalData.length > 0 && historicalData.length < this.MIN_HISTORICAL_DATA) {
                console.log(`Usando ${historicalData.length} registros disponíveis para recomendações do produto ${productId}`);
                
                // Gera recomendações básicas com os dados disponíveis
                const basicRecommendations = this._generateBasicRecommendations(historicalData);
                return {
                    productId,
                    recommendations: basicRecommendations,
                    basedOn: {
                        dataPoints: historicalData.length,
                        dateRange: {
                            start: historicalData[0].date,
                            end: historicalData[historicalData.length - 1].date
                        }
                    },
                    warning: `Dados históricos limitados (${historicalData.length}/${this.MIN_HISTORICAL_DATA} dias recomendados). Recomendações podem ser imprecisas.`
                };
            }
            
            // Validação normal
            if (historicalData.length < this.MIN_HISTORICAL_DATA) {
                throw new Error(`Dados históricos insuficientes para o produto ${productId}. Necessário pelo menos ${this.MIN_HISTORICAL_DATA} dias.`);
            }

            const recommendations = this._generateRecommendations(historicalData);
            return {
                productId,
                recommendations,
                basedOn: {
                    dataPoints: historicalData.length,
                    dateRange: {
                        start: historicalData[0].date,
                        end: historicalData[historicalData.length - 1].date
                    }
                }
            };
        } catch (error) {
            console.error(`Erro ao gerar recomendações para o produto ${productId}:`, error);
            throw error;
        }
    }

    async getMetrics(productId, startDate, endDate) {
        try {
            const metrics = await this.historicalDataRepository.getAggregatedMetrics(productId, startDate, endDate);
            const historicalData = await this.historicalDataRepository.getHistoricalData(productId);
            
            // Verificação para produtos com dados insuficientes
            if (historicalData.length > 0 && historicalData.length < this.MIN_HISTORICAL_DATA) {
                const trend = this._calculateTrend(historicalData);
                return {
                    ...metrics,
                    trend,
                    period: { startDate, endDate },
                    warning: `Dados históricos limitados (${historicalData.length}/${this.MIN_HISTORICAL_DATA} dias recomendados). Métricas podem não refletir tendências reais.`
                };
            }
            
            const trend = this._calculateTrend(historicalData);
            return {
                ...metrics,
                trend,
                period: { startDate, endDate }
            };
        } catch (error) {
            console.error(`Erro ao obter métricas para o produto ${productId}:`, error);
            throw error;
        }
    }

    _calculatePrediction(historicalData) {
        // Implementação usando média móvel de 7 dias
        const recentData = historicalData.slice(-7);
        const avgVolume = recentData.reduce((sum, data) => sum + data.volume, 0) / recentData.length;
        return Math.round(avgVolume);
    }

    _detectAnomalies(historicalData) {
        const volumes = historicalData.map(data => data.volume);
        const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const stdDev = Math.sqrt(
            volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
        );
        
        const threshold = mean + (2 * stdDev);
        let anomalies = [];

        // Detecta sazonalidade
        const seasonality = this._detectSeasonality(historicalData);
        
        // Detecta tendência
        const trend = this._calculateTrend(historicalData);

        /**
         * DOCUMENTAÇÃO DOS PARÂMETROS DE ANOMALIAS
         * 
         * Os seguintes parâmetros foram ajustados após análise dos resultados:
         * 
         * 1. VOLUME_SPIKE
         *    - Threshold: 1.5 desvios padrão acima da média da janela (reduzido de 2.0)
         *    - Justificativa: Permite detectar picos menos severos mas ainda significativos
         *    - Severidade: ALTA
         *    - Prioridade de detecção: 1 (máxima)
         * 
         * 2. VOLUME_DROP
         *    - Threshold: 1.5 desvios padrão abaixo da média da janela (reduzido de 2.0)
         *    - Justificativa: Permite detectar quedas menos severas mas ainda significativas
         *    - Severidade: MÉDIA
         *    - Prioridade de detecção: 2
         * 
         * 3. SUSTAINED_INCREASE
         *    - Threshold1: 170% da média da janela para média de 3 dias (reduzido de 200%)
         *    - Threshold2: 130% da média da janela para volume atual (reduzido de 150%)
         *    - Justificativa: Permite capturar aumentos sustentados menos extremos
         *    - Severidade: ALTA
         *    - Prioridade de detecção: 3
         * 
         * 4. SUSTAINED_DECREASE
         *    - Threshold1: 60% da média da janela para média de 3 dias (40% abaixo)
         *    - Threshold2: 70% da média da janela para volume atual (30% abaixo)
         *    - Justificativa: Balanceia entre sensibilidade e precisão
         *    - Severidade: MÉDIA
         *    - Prioridade de detecção: 4
         * 
         * 5. CYCLIC_PATTERN
         *    - Threshold: 80% de desvio do padrão esperado (aumentado de 50%)
         *    - Justificativa: Reduz falsos positivos, detectando apenas desvios cíclicos realmente significativos
         *    - Severidade: MÉDIA
         *    - Prioridade de detecção: 5 (menor)
         */

        // Análise por janela deslizante (7 dias)
        const windowSize = 7;
        for (let i = windowSize -1; i < historicalData.length; i++) {
            const currentDataPoint = historicalData[i];
            const currentDate = currentDataPoint.date;
            
            const shouldLog = currentDate === '2025-03-05';
            if (shouldLog) console.log(`\n[Service Log] Analisando data: ${currentDate}`);
            
            // Calcular métricas da janela atual
            const currentWindowData = historicalData.slice(i - windowSize + 1, i + 1);
            if (currentWindowData.length !== windowSize) continue; // Pular se a janela não estiver completa
            
            const currentWindowVolumes = currentWindowData.map(d => d.volume);
            const windowMean = currentWindowVolumes.reduce((sum, vol) => sum + vol, 0) / windowSize;
            // Calcular Desvio Padrão da Janela
            const windowVariance = currentWindowVolumes.reduce((sum, vol) => sum + Math.pow(vol - windowMean, 2), 0) / windowSize;
            const windowStdDev = Math.sqrt(windowVariance);

            const currentVolume = currentDataPoint.volume;
             if (shouldLog) {
                 console.log(`[Service Log]   Volume: ${currentVolume}, Média Janela: ${windowMean.toFixed(2)}, Desvio Padrão Janela: ${windowStdDev.toFixed(2)}`);
                 console.log(`[Service Log]   (Desvio Padrão Global era: ${stdDev.toFixed(2)})`); // Log do stdDev global para comparação
             }
            
            // Array para armazenar anomalias detectadas para a data atual
            const dateAnomalies = [];
            
            // 1. VOLUME_SPIKE - Usar windowStdDev com multiplicador ajustado
            const spikeMultiplier = 1.5; // <-- AJUSTADO de 2.0 para 1.5
            const spikeThreshold = windowMean + (spikeMultiplier * windowStdDev); 
            const isVolumeSpike = currentVolume > spikeThreshold;
            if (shouldLog) console.log(`[Service Log]   VOLUME_SPIKE Check: ${currentVolume} > ${spikeThreshold.toFixed(2)} (Média + ${spikeMultiplier} * Desvio Janela) ? ${isVolumeSpike}`);
            if (isVolumeSpike) {
                dateAnomalies.push({
                    id: `ANM-${currentDate.replace(/-/g, "")}-SPIKE-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    date: currentDate,
                    volume: currentVolume,
                    threshold: spikeThreshold,
                    deviation: windowStdDev > 0 ? ((currentVolume - windowMean) / windowStdDev).toFixed(2) : 'inf',
                    severity: 'ALTA',
                    description: `Pico anormal no volume de incidentes (${currentVolume} vs média janela ${Math.round(windowMean)}, stdDev janela ${windowStdDev.toFixed(2)})`,
                    type: 'VOLUME_SPIKE',
                    confidence: Math.min(0.95, 0.7 + (windowStdDev > 0 ? (((currentVolume - windowMean) / windowStdDev) / 10) : 0)),
                    priority: 1 // Maior prioridade
                });
            }
            
            // 2. VOLUME_DROP - Manter multiplicador ajustado
            const dropMultiplier = 1.5; // <-- AJUSTADO de 2.0 para 1.5
            const dropThreshold = windowMean - (dropMultiplier * windowStdDev); 
            const isVolumeDrop = currentVolume < dropThreshold;
            if (shouldLog) console.log(`[Service Log]   VOLUME_DROP Check: ${currentVolume} < ${dropThreshold.toFixed(2)} (Média - ${dropMultiplier} * Desvio Janela) ? ${isVolumeDrop}`);
            if (isVolumeDrop) {
                dateAnomalies.push({
                    id: `ANM-${currentDate.replace(/-/g, "")}-DROP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    date: currentDate,
                    volume: currentVolume,
                    threshold: dropThreshold,
                    deviation: windowStdDev > 0 ? ((windowMean - currentVolume) / windowStdDev).toFixed(2) : 'inf',
                    severity: 'MÉDIA',
                    description: `Queda significativa no volume de incidentes (${currentVolume} vs média janela ${Math.round(windowMean)}, stdDev janela ${windowStdDev.toFixed(2)})`,
                    type: 'VOLUME_DROP',
                    confidence: Math.min(0.90, 0.6 + (windowStdDev > 0 ? (((windowMean - currentVolume) / windowStdDev) / 10) : 0)),
                    priority: 2
                 });
            }
            
            // 3. SUSTAINED_INCREASE - Usa windowMean e volume atual (AJUSTANDO thresholds)
            let isSustainedIncrease = false;
            let threeDayAvg = 0; // Declarando no escopo mais amplo para evitar problemas de referência
            
            if (i >= windowSize + 1) { 
                const threeDayData = historicalData.slice(i - 2, i + 1);
                threeDayAvg = threeDayData.reduce((sum, data) => sum + data.volume, 0) / 3;
                const sustainedThreshold1 = windowMean * 1.7; // <-- AJUSTADO de 2.0 para 1.7
                const sustainedThreshold2 = windowMean * 1.3; // <-- AJUSTADO de 1.5 para 1.3
                isSustainedIncrease = threeDayAvg > sustainedThreshold1 && currentVolume > sustainedThreshold2;
                if (shouldLog) console.log(`[Service Log]   SUSTAINED_INCREASE Check: Avg3(${threeDayAvg.toFixed(2)}) > Thresh1(${sustainedThreshold1.toFixed(2)}) && Vol(${currentVolume}) > Thresh2(${sustainedThreshold2.toFixed(2)}) ? ${isSustainedIncrease}`);
            } else if (shouldLog) {
                 console.log(`[Service Log]   SUSTAINED_INCREASE Check: Dados insuficientes (índice ${i} < ${windowSize + 1})`);
            }
            if (isSustainedIncrease) {
                dateAnomalies.push({
                    id: `ANM-${currentDate.replace(/-/g, "")}-INC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    date: currentDate,
                        volume: currentVolume,
                    threshold: windowMean * 1.7, // <-- AJUSTADO de 2.0 para 1.7
                    deviation: windowMean > 0 ? ((threeDayAvg - windowMean) / windowMean).toFixed(2) : 'inf',
                        severity: 'ALTA',
                    description: `Aumento sustentado no volume de incidentes por 3 dias (média 3d: ${Math.round(threeDayAvg)} vs média janela: ${Math.round(windowMean)})`,
                        type: 'SUSTAINED_INCREASE',
                    confidence: 0.85,
                    priority: 3
                });
            }
            
            // 4. SUSTAINED_DECREASE - Nova implementação
            let isSustainedDecrease = false;
            let threeDayAvgDecrease = 0;
            
            if (i >= windowSize + 1) {
                // Pegar dados dos últimos 3 dias incluindo o atual
                const lastThreeDays = historicalData.slice(i - 2, i + 1);
                // Calcular média dos volumes nos últimos 3 dias
                threeDayAvgDecrease = lastThreeDays.reduce((sum, data) => sum + data.volume, 0) / 3;
                
                // Definir thresholds como porcentagens da média da janela
                const decreaseThreshold1 = windowMean * 0.6; // Média precisa estar 40% abaixo
                const decreaseThreshold2 = windowMean * 0.7; // Volume atual precisa estar 30% abaixo
                
                // Verificar se atende aos critérios de queda sustentada
                isSustainedDecrease = (threeDayAvgDecrease < decreaseThreshold1) && (currentVolume < decreaseThreshold2);
                
                if (shouldLog) {
                    console.log(`[Service Log]   SUSTAINED_DECREASE Check: Média 3d(${threeDayAvgDecrease.toFixed(2)}) < Thresh1(${decreaseThreshold1.toFixed(2)}) && Vol(${currentVolume}) < Thresh2(${decreaseThreshold2.toFixed(2)}) ? ${isSustainedDecrease}`);
                }
            }
            
            // Se for uma queda sustentada, adicionar à lista de anomalias
            if (isSustainedDecrease) {
                dateAnomalies.push({
                    id: `ANM-${currentDate.replace(/-/g, "")}-DEC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    date: currentDate,
                    volume: currentVolume,
                    threshold: windowMean * 0.6,
                    deviation: windowMean > 0 ? ((windowMean - threeDayAvgDecrease) / windowMean).toFixed(2) : 'inf',
                    severity: 'MÉDIA',
                    description: `Diminuição sustentada no volume de incidentes por 3 dias (média 3d: ${Math.round(threeDayAvgDecrease)} vs média janela: ${Math.round(windowMean)})`,
                    type: 'SUSTAINED_DECREASE',
                    confidence: 0.85,
                    priority: 4
                });
            }
            
            // 5. CYCLIC_PATTERN - Mantém threshold em 0.8 (80%)
            let isCyclicAnomaly = false;
            let expectedVolume = undefined; 
            let cyclicDeviation = 0; 

            if (seasonality.isSeasonal) {
                // Recalcular médias do dia da semana com base nos dados até o ponto atual 'i'
                const relevantHistoricalData = historicalData.slice(0, i + 1);
                const byDayOfWeek = {};
                relevantHistoricalData.forEach(row => {
                    const dayOfWeek = new Date(row.date + 'T00:00:00').getUTCDay(); 
                    if (!byDayOfWeek[dayOfWeek]) {
                         byDayOfWeek[dayOfWeek] = [];
                    }
                     byDayOfWeek[dayOfWeek].push(row.volume);
                });
            
                const dayOfWeekAverages = {};
                Object.keys(byDayOfWeek).forEach(day => {
                    const volumes = byDayOfWeek[day];
                     dayOfWeekAverages[day] = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
                });

                const currentDayOfWeek = new Date(currentDate + 'T00:00:00').getUTCDay();
                expectedVolume = dayOfWeekAverages[currentDayOfWeek]; 
                
                if (expectedVolume !== undefined && expectedVolume > 0) {
                    cyclicDeviation = Math.abs(currentVolume - expectedVolume) / expectedVolume;
                    isCyclicAnomaly = cyclicDeviation > 0.8; // <-- AJUSTADO de 0.5 para 0.8
                } else if (expectedVolume === undefined && shouldLog) {
                     console.log(`[Service Log]   CYCLIC_PATTERN Check: Média para dia ${currentDayOfWeek} não encontrada.`);
                }
                if (shouldLog) console.log(`[Service Log]   CYCLIC_PATTERN Check: Dia ${currentDayOfWeek}, Vol(${currentVolume}), Esperado(${expectedVolume ? expectedVolume.toFixed(2) : 'N/A'}), Desvio(${expectedVolume > 0 ? (cyclicDeviation * 100).toFixed(2) + '%' : 'N/A'}) > 80%? ${isCyclicAnomaly}`);
            }
            if (isCyclicAnomaly) {
                dateAnomalies.push({
                    id: `ANM-${currentDate.replace(/-/g, "")}-CYC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    date: currentDate,
                        volume: currentVolume,
                        threshold: expectedVolume,
                    deviation: cyclicDeviation.toFixed(2),
                        severity: 'MÉDIA',
                    description: `Desvio significativo do padrão cíclico semanal (${currentVolume} vs esperado ${expectedVolume ? Math.round(expectedVolume) : 'N/A'})`,
                        type: 'CYCLIC_PATTERN',
                    confidence: Math.min(0.85, 0.6 + cyclicDeviation),
                    priority: 5 // Menor prioridade
                });
            }
            
            // Aplica sistema de priorização (quanto menor o número, maior a prioridade)
            if (dateAnomalies.length > 0) {
                // Se houver múltiplas anomalias detectadas para a mesma data, escolhe a de maior prioridade
                if (dateAnomalies.length > 1) {
                    // Ordena por prioridade (menor número = maior prioridade)
                    dateAnomalies.sort((a, b) => a.priority - b.priority);
                    
                    // Adiciona a anomalia de maior prioridade à lista final
                    anomalies.push(dateAnomalies[0]);
                    
                    if (shouldLog) {
                        console.log(`[Service Log]   Múltiplas anomalias detectadas para ${currentDate}. Selecionada: ${dateAnomalies[0].type} (prioridade ${dateAnomalies[0].priority})`);
                    }
                } else {
                    // Se houver apenas uma anomalia, a adiciona normalmente
                    anomalies.push(dateAnomalies[0]);
                }
            }
        }
                
                return {
            anomalies, 
                    threshold,
            metadata: {
                seasonality,
                trend,
                baseMetrics: {
                    mean,
                    stdDev,
                    coefficientOfVariation: stdDev / mean
                }
            }
        };
    }

    _generateRecommendations(historicalData) {
        const trend = this._calculateTrend(historicalData);
        const recentData = historicalData.slice(-7);
        const avgVolume = recentData.reduce((sum, data) => sum + data.volume, 0) / recentData.length;

        const recommendations = [];

        if (trend > 0.1) {
            recommendations.push({
                type: 'CAPACITY',
                description: 'Aumentar capacidade de atendimento',
                priority: 'HIGH',
                impact: 'Prevenir sobrecarga do sistema'
            });
        } else if (trend < -0.1) {
            recommendations.push({
                type: 'OPTIMIZATION',
                description: 'Otimizar recursos de atendimento',
                priority: 'MEDIUM',
                impact: 'Melhorar eficiência operacional'
            });
        }

        if (avgVolume > 100) {
            recommendations.push({
                type: 'MONITORING',
                description: 'Implementar monitoramento proativo',
                priority: 'HIGH',
                impact: 'Detectar problemas antecipadamente'
            });
        }

        return recommendations;
    }

    _calculateTrend(historicalData) {
        const midPoint = Math.floor(historicalData.length / 2);
        const firstHalf = historicalData.slice(0, midPoint);
        const secondHalf = historicalData.slice(midPoint);

        const firstHalfAvg = firstHalf.reduce((sum, data) => sum + data.volume, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, data) => sum + data.volume, 0) / secondHalf.length;

        return (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    }

    _calculateConfidence(historicalData) {
        // Implementação simplificada de confiança baseada na variância dos dados
        const volumes = historicalData.map(data => data.volume);
        const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length;
        
        // Normaliza a confiança entre 0 e 1
        const maxVariance = Math.pow(mean, 2); // Assumindo que a variância máxima seria o quadrado da média
        return Math.max(0, Math.min(1, 1 - (variance / maxVariance)));
    }

    _calculateAverageResolutionTime(incidents) {
        const resolvedIncidents = incidents.filter(incident => incident.resolutionTime);
        if (resolvedIncidents.length === 0) return null;
        
        const totalTime = resolvedIncidents.reduce((sum, incident) => sum + incident.resolutionTime, 0);
        return totalTime / resolvedIncidents.length;
    }

    _calculateCategoryDistribution(incidents) {
        const distribution = {};
        incidents.forEach(incident => {
            const category = incident.category || 'UNKNOWN';
            distribution[category] = (distribution[category] || 0) + 1;
        });
        
        return Object.entries(distribution).map(([category, count]) => ({
            category,
            count
        }));
    }

    _calculatePriorityDistribution(incidents) {
        const distribution = {};
        incidents.forEach(incident => {
            const priority = incident.priority || 'UNKNOWN';
            distribution[priority] = (distribution[priority] || 0) + 1;
        });
        
        return Object.entries(distribution).map(([priority, count]) => ({
            priority,
            count
        }));
    }

    _calculateGroupDistribution(incidents) {
        const distribution = {};
        incidents.forEach(incident => {
            const group = incident.groupName || 'UNKNOWN';
            distribution[group] = (distribution[group] || 0) + 1;
        });
        
        return Object.entries(distribution).map(([group, count]) => ({
            group,
            count
        }));
    }

    _detectSeasonality(data) {
        if (data.length < 14) return { isSeasonal: false };
        
        // Análise de padrões semanais
        const weeklyPatterns = new Array(7).fill(0).map(() => ({
            sum: 0,
            count: 0,
            avg: 0,
            variance: 0
        }));

        // Calcula médias por dia da semana
        data.forEach((item, index) => {
            const dayOfWeek = index % 7;
            weeklyPatterns[dayOfWeek].sum += item.volume;
            weeklyPatterns[dayOfWeek].count++;
        });

        // Calcula média e variância para cada dia da semana
        weeklyPatterns.forEach(pattern => {
            pattern.avg = pattern.sum / pattern.count;
        });

        // Calcula variância global
        const globalAvg = data.reduce((sum, item) => sum + item.volume, 0) / data.length;
        const globalVariance = data.reduce((sum, item) => 
            sum + Math.pow(item.volume - globalAvg, 2), 0) / data.length;

        // Calcula variância entre dias da semana
        const weekdayVariance = weeklyPatterns.reduce((sum, pattern) => 
            sum + Math.pow(pattern.avg - globalAvg, 2), 0) / 7;

        // Calcula o índice de sazonalidade
        const seasonalityIndex = weekdayVariance / globalVariance;

        // Identifica padrões específicos
        const workdayAvg = weeklyPatterns.slice(0, 5)
            .reduce((sum, p) => sum + p.avg, 0) / 5;
        const weekendAvg = weeklyPatterns.slice(5)
            .reduce((sum, p) => sum + p.avg, 0) / 2;
        
        const hasWorkdayPattern = Math.abs(workdayAvg - weekendAvg) / globalAvg > 0.3;
        
        return {
            isSeasonal: seasonalityIndex > 0.1 || hasWorkdayPattern,
            period: 7,
            seasonalityIndex: seasonalityIndex.toFixed(2),
            patterns: {
                workdays: {
                    average: workdayAvg.toFixed(2),
                    normalizedDiff: ((workdayAvg - globalAvg) / globalAvg).toFixed(2)
                },
                weekends: {
                    average: weekendAvg.toFixed(2),
                    normalizedDiff: ((weekendAvg - globalAvg) / globalAvg).toFixed(2)
                }
            },
            dailyPatterns: weeklyPatterns.map(p => ({
                average: p.avg.toFixed(2),
                normalizedDiff: ((p.avg - globalAvg) / globalAvg).toFixed(2)
            }))
        };
    }

    /**
     * Obtém histórico de previsões para um produto
     * @param {string} productId - ID do produto
     * @param {string} startDate - Data inicial
     * @param {string} endDate - Data final
     * @returns {Promise<Array>} Histórico de previsões
     */
    async getPredictionHistory(productId, startDate, endDate) {
        try {
            // Obter dados históricos no período especificado
            const historicalData = await this.historicalDataRepository.getHistoricalData(
                productId,
                startDate,
                endDate
            );

            if (historicalData.length === 0) {
                return [];
            }

            // Para cada ponto de dados históricos, calcular uma previsão retroativa
            return historicalData.map(data => {
                // Pegar apenas os dados anteriores à data atual para fazer a previsão
                const previousData = historicalData.filter(h => h.date < data.date);
                
                // Calcular o volume previsto com os dados disponíveis
                const prediction = this._calculatePredictionWithLimitedData(previousData);

                // Calcular a precisão da previsão em relação ao valor real
                const accuracy = this._calculateAccuracy(data.volume, prediction);

                return {
                    date: data.date,
                    predictedVolume: prediction || 0, // Garantir que nunca retorne null
                    actualVolume: data.volume,
                    accuracy: accuracy
                };
            });
        } catch (error) {
            console.error('Erro ao obter histórico de previsões:', error);
            throw error;
        }
    }

    /**
     * Marca uma notificação como lida
     * @param {string} notificationId - ID da notificação
     * @returns {Promise<Object>} Resultado da operação
     */
    async markNotificationAsRead(notificationId) {
        // Em uma implementação real, isso atualizaria o status no banco de dados
        console.log(`Notificação ${notificationId} marcada como lida`);
        return { success: true };
    }

    /**
     * Calcula a precisão da previsão em relação ao valor real
     * @param {number} actualVolume - Volume real
     * @param {number} predictedVolume - Volume previsto
     * @returns {number} Precisão da previsão (0-100%)
     */
    _calculateAccuracy(actualVolume, predictedVolume) {
        if (actualVolume === 0 && predictedVolume === 0) return 100;
        if (actualVolume === 0) return 0;
        
        const percentageDiff = Math.abs((predictedVolume - actualVolume) / actualVolume) * 100;
        return Math.max(0, 100 - percentageDiff);
    }

    /**
     * Calcula uma previsão com base em dados históricos limitados
     * @param {Array} historicalData - Dados históricos disponíveis
     * @returns {number} Volume previsto
     */
    _calculatePredictionWithLimitedData(historicalData) {
        if (!historicalData || historicalData.length === 0) {
            return 0;
        }

        // Se tivermos poucos dados, usar média simples
        if (historicalData.length < 5) {
            const sum = historicalData.reduce((acc, curr) => acc + curr.volume, 0);
            return Math.round(sum / historicalData.length);
        }

        // Com mais dados, usar regressão linear
        // Passando os dados históricos diretamente, não apenas os volumes
        const result = this.algorithms.linearRegression(historicalData);
        
        // Garantir que o resultado seja um número válido
        if (!result || typeof result.volume !== 'number') {
            // Fallback para média móvel se a regressão linear falhar
            const recentData = historicalData.slice(-7);
            const sum = recentData.reduce((acc, curr) => acc + curr.volume, 0);
            return Math.round(sum / recentData.length);
        }

        return Math.round(result.volume);
    }

    // Métodos auxiliares para tratamento de dados insuficientes
    
    _calculateBasicThreshold(historicalData) {
        // Cálculo simplificado de limiar para detecção de anomalias com poucos dados
        const volumes = historicalData.map(data => data.volume);
        const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        // Usamos um multiplicador maior para evitar falsos positivos
        return mean * 1.5; 
    }
    
    _generateBasicRecommendations(historicalData) {
        // Recomendação genérica quando há poucos dados
        return [
            {
                type: 'DATA_COLLECTION',
                description: 'Coletar mais dados históricos para análises mais precisas',
                priority: 'HIGH',
                impact: 'Melhorar a qualidade das previsões e detecção de anomalias'
            },
            {
                type: 'MONITORING',
                description: 'Implementar monitoramento básico',
                priority: 'MEDIUM',
                impact: 'Acompanhar comportamento do sistema'
            }
        ];
    }

    /**
     * Obtém histórico de volume para um produto
     * @param {string} productId ID do produto
     * @param {string} targetDate Data alvo
     * @param {number} monthsBack Número de meses para trás
     * @returns {Promise<Array>} Array com histórico de volumes
     */
    async getVolumeHistory(productId, targetDate, monthsBack) {
        try {
            // Calcula a data inicial baseada nos meses para trás
            const startDate = new Date(targetDate);
            startDate.setMonth(startDate.getMonth() - monthsBack);

            const historicalData = await this.historicalDataRepository.getHistoricalData(
                productId,
                startDate.toISOString().split('T')[0],
                targetDate
            );

            return historicalData;
        } catch (error) {
            console.error(`Erro ao obter histórico de volume para ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Calcula uma previsão usando ensemble de múltiplos modelos
     * @param {Array} historicalData - Dados históricos disponíveis
     * @returns {Object} Resultado com volume previsto e confiança
     * @private
     */
    _calculateEnsemblePrediction(historicalData) {
        if (!historicalData || historicalData.length < 5) {
            // Se há poucos dados, voltamos ao método simples
            return {
                volume: this._calculatePredictionWithLimitedData(historicalData),
                confidence: 0.5 // Confiança reduzida devido aos poucos dados
            };
        }

        // Obter predições de diferentes modelos
        const linearRegressionResult = this.algorithms.linearRegression(historicalData);
        const arimaResult = this.algorithms.arima(historicalData);
        const movingAverageResult = this.algorithms.movingAverage(historicalData);
        
        // Calcular peso de cada modelo baseado nas características dos dados
        const weights = this._calculateModelWeights(historicalData);
        
        // Aplicar pesos aos resultados dos modelos
        const weightedSum = (
            linearRegressionResult.volume * weights.linearRegression + 
            arimaResult.volume * weights.arima + 
            movingAverageResult.volume * weights.movingAverage
        );
        
        // Volume previsto é a média ponderada dos resultados
        const predictedVolume = Math.round(weightedSum / (
            weights.linearRegression + weights.arima + weights.movingAverage
        ));
        
        // Confiança é baseada na concordância entre os modelos
        const values = [linearRegressionResult.volume, arimaResult.volume, movingAverageResult.volume];
        const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / meanValue;
        
        // Quanto menor a variação entre modelos, maior a confiança
        const confidenceFromAgreement = Math.max(0.3, Math.min(0.9, 1 - coefficientOfVariation));
        
        // Combinamos a confiança baseada em concordância com as confianças individuais dos modelos
        const avgModelConfidence = (
            linearRegressionResult.confidence * weights.linearRegression + 
            arimaResult.confidence * weights.arima + 
            movingAverageResult.confidence * weights.movingAverage
        ) / (weights.linearRegression + weights.arima + weights.movingAverage);
        
        // Confiança final é uma combinação da concordância e da confiança média dos modelos
        const confidence = 0.7 * confidenceFromAgreement + 0.3 * avgModelConfidence;
        
        return {
            volume: predictedVolume,
            confidence: parseFloat(confidence.toFixed(2)),
            modelDetails: {
                linearRegression: linearRegressionResult.volume,
                arima: arimaResult.volume,
                movingAverage: movingAverageResult.volume,
                weights
            }
        };
    }
    
    /**
     * Calcula pesos para cada modelo baseado nas características dos dados
     * @param {Array} historicalData - Dados históricos
     * @returns {Object} Pesos para cada modelo
     * @private
     */
    _calculateModelWeights(historicalData) {
        const dataLength = historicalData.length;
        
        // Verificar se há tendência clara nos dados
        const trend = this._calculateTrend(historicalData);
        const hasTrend = Math.abs(trend) > 0.05;
        
        // Verificar se há sazonalidade
        const seasonality = this._detectSeasonality(historicalData);
        const hasSeasonality = seasonality.isSeasonal;
        
        // Calcular volatilidade (variação) dos dados
        const volumes = historicalData.map(data => data.volume);
        const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length;
        const coeffVar = Math.sqrt(variance) / mean;
        const highVolatility = coeffVar > 0.3;
        
        // Definir pesos iniciais
        let weights = {
            linearRegression: 1,
            arima: 1,
            movingAverage: 1
        };
        
        // Ajustar pesos baseado nas características dos dados
        
        // 1. Regressão linear funciona melhor com tendências claras e pouca volatilidade
        if (hasTrend && !highVolatility) {
            weights.linearRegression += 1;
        }
        
        // 2. ARIMA funciona melhor com sazonalidade e séries temporais mais longas
        if (hasSeasonality && dataLength >= 30) {
            weights.arima += 1;
        }
        
        // 3. Média móvel funciona melhor com dados estáveis e sem sazonalidade
        if (!hasSeasonality && !highVolatility) {
            weights.movingAverage += 1;
        }
        
        // 4. Penalizar modelos menos adequados para certas condições
        if (highVolatility) {
            weights.linearRegression -= 0.5;
        }
        
        if (dataLength < 30) {
            weights.arima -= 0.5;
        }
        
        if (hasTrend) {
            weights.movingAverage -= 0.3;
        }
        
        // Garantir que todos os pesos sejam positivos
        Object.keys(weights).forEach(key => {
            weights[key] = Math.max(0.2, weights[key]);
        });
        
        return weights;
    }

    /**
     * Obtém previsões de volume para os próximos dias usando ensemble de modelos
     * @param {string} productId - ID do produto
     * @param {string} targetDate - Data alvo para início das previsões
     * @param {number} daysForward - Número de dias para prever
     * @returns {Promise<Array>} Array com previsões diárias
     */
    async getPredictionsWithEnsemble(productId, targetDate, daysForward) {
        try {
            console.log(`Gerando previsão com ensemble para ${productId}, data alvo: ${targetDate}, dias: ${daysForward}`);
            
            const startDate = new Date(targetDate);
            const endDate = new Date(targetDate);
            endDate.setDate(endDate.getDate() + daysForward);
            
            // Obter dados históricos até a data inicial com período mais longo
            const historicalData = await this.historicalDataRepository.getHistoricalData(
                productId,
                new Date(startDate.setMonth(startDate.getMonth() - 3)).toISOString().split('T')[0], // 3 meses de histórico
                targetDate
            );

            if (!historicalData || historicalData.length === 0) {
                throw new Error('Dados históricos insuficientes para gerar previsões');
            }
            
            console.log(`Encontrados ${historicalData.length} pontos de dados históricos`);

            // Cálculo de estatísticas dos dados históricos para diagnosticar o problema
            const volumes = historicalData.map(d => d.volume);
            const minVolume = Math.min(...volumes);
            const maxVolume = Math.max(...volumes);
            const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
            
            // Utilizar a média dos últimos 30 dias (ou menos se não houver dados suficientes)
            const recentPeriod = Math.min(30, historicalData.length);
            const recentData = historicalData.slice(-recentPeriod);
            const recentVolumes = recentData.map(d => d.volume);
            const recentAvg = recentVolumes.reduce((sum, v) => sum + v, 0) / recentPeriod;
            
            // Calcular limites razoáveis baseados nos dados históricos
            // Não permitir previsões que sejam mais de 30% acima do máximo histórico
            // ou 30% abaixo do mínimo histórico
            const upperLimit = maxVolume * 1.3;
            const lowerLimit = Math.max(minVolume * 0.7, 1); // Nunca abaixo de 1
            
            const lastVolume = historicalData[historicalData.length - 1].volume;
            
            console.log(`Estatísticas: Min=${minVolume}, Max=${maxVolume}, Média=${avgVolume.toFixed(2)}, Último=${lastVolume}`);
            console.log(`Limites de previsão: Inferior=${lowerLimit.toFixed(2)}, Superior=${upperLimit.toFixed(2)}`);
            
            // Calcular tendência global dos dados - ATENUADA para evitar crescimento exagerado
            const trendAnalysis = this._calculateDetailedTrend(historicalData);
            // Reduzir a força da tendência para 25% para evitar crescimento/queda excessivos
            trendAnalysis.rate = trendAnalysis.rate * 0.25;
            
            console.log(`Tendência (atenuada): ${trendAnalysis.direction}, Taxa: ${trendAnalysis.rate.toFixed(4)}, Força: ${trendAnalysis.strength.toFixed(2)}`);

            const predictions = [];
            let currentDate = new Date(targetDate);
            let lastPrediction = null;
            let simulatedHistoricalData = [...historicalData];
            
            // Reduzir a aleatoriedade para valores menores
            const randomFactor = () => (Math.random() * 0.03) - 0.015; // Variação de -1.5% a +1.5%
            
            // Verificar se há sazonalidade nos dados
            const seasonality = this._detectSeasonality(historicalData);
            const hasSeasonality = seasonality.isSeasonal;
            
            console.log(`Sazonalidade detectada: ${hasSeasonality ? 'Sim' : 'Não'}`);
            
            let dayCounter = 0;
            // Uma forma de regressão à média: quanto mais dias no futuro, 
            // mais tendemos a voltar para a média histórica recente
            const regressionToMeanFactor = 0.03; // 3% de retorno à média por dia
            
            while (currentDate <= endDate) {
                let baseVolume;
                
                if (lastPrediction) {
                    // Se não for a primeira previsão, usar a anterior como base
                    baseVolume = lastPrediction.predictedVolume;
                    
                    // Aplicar uma variação com base na tendência detectada e fator aleatório
                    // Reduzir progressivamente o efeito da tendência quanto mais longe no futuro
                    const trendEffect = trendAnalysis.rate * Math.max(0.5, 1 - (dayCounter * 0.05));
                    // Adicionar aleatoriedade suave
                    const randomEffect = randomFactor();
                    
                    // Aplicar regressão à média: puxar suavemente em direção à média recente
                    const meanEffect = (recentAvg - baseVolume) / baseVolume;
                    const regressionEffect = meanEffect * regressionToMeanFactor * dayCounter;
                    
                    // Combinar os efeitos, limitando a variação máxima entre dias consecutivos
                    const totalEffect = trendEffect + randomEffect + regressionEffect;
                    const limitedEffect = Math.max(-0.05, Math.min(0.05, totalEffect)); // Limitar entre -5% e +5%
                    
                    baseVolume = Math.round(baseVolume * (1 + limitedEffect));
                } else {
                    // Para a primeira previsão, usar o ensemble completo
                    const prediction = this._calculateEnsemblePrediction(simulatedHistoricalData);
                    baseVolume = prediction.predictedVolume || lastVolume;
                    
                    // Garantir que a primeira previsão seja próxima do último valor real
                    // Limitar a no máximo 10% de diferença
                    const maxFirstDayVariation = 0.10;
                    if (Math.abs(baseVolume - lastVolume) / lastVolume > maxFirstDayVariation) {
                        const direction = baseVolume > lastVolume ? 1 : -1;
                        baseVolume = Math.round(lastVolume * (1 + direction * maxFirstDayVariation));
                    }
                }
                
                // Aplicar ajuste sazonal se identificado
                if (hasSeasonality) {
                    const dayOfWeek = currentDate.getDay();
                    if (seasonality.dailyPatterns && seasonality.dailyPatterns[dayOfWeek]) {
                        // Atenuar o efeito sazonal para 70% para evitar oscilações extremas
                        const seasonalFactor = 1 + (parseFloat(seasonality.dailyPatterns[dayOfWeek].normalizedDiff || 0) * 0.7);
                        baseVolume = Math.round(baseVolume * seasonalFactor);
                    }
                }
                
                // Garantir que o volume previsto não extrapole os limites razoáveis
                baseVolume = Math.max(lowerLimit, Math.min(upperLimit, baseVolume));
                
                // Ajustar confiança baseado na distância do dia atual
                const daysFromStart = dayCounter;
                // Confiança diminui com o tempo, mas nunca abaixo de 40%
                const confidenceLevel = Math.max(0.4, 0.9 - (daysFromStart * 0.05));
                
                const prediction = {
                    date: currentDate.toISOString().split('T')[0],
                    predictedVolume: baseVolume,
                    confidence: Math.round(confidenceLevel * 100)
                };
                
                predictions.push(prediction);
                
                // Armazenar esta previsão para uso na próxima iteração
                lastPrediction = prediction;
                
                // Simular adição deste ponto à série histórica para a próxima previsão
                simulatedHistoricalData.push({
                    date: prediction.date,
                    volume: prediction.predictedVolume
                });
                
                // Avançar para o próximo dia
                currentDate.setDate(currentDate.getDate() + 1);
                dayCounter++;
            }
            
            // Log de validação final
            console.log("Verificação de previsões geradas:");
            predictions.forEach((p, index) => {
                console.log(`  Dia ${index+1}: ${p.date} = ${p.predictedVolume}`);
            });
            
            return predictions;
        } catch (error) {
            console.error('Erro ao gerar previsões com ensemble:', error);
            throw error;
        }
    }

    /**
     * Calcula tendência detalhada dos dados históricos
     * @param {Array} historicalData Dados históricos
     * @returns {Object} Detalhes da tendência
     * @private
     */
    _calculateDetailedTrend(historicalData) {
        if (historicalData.length < 5) {
            return { 
                direction: 'neutra', 
                rate: 0,
                strength: 0 
            };
        }
        
        const volumes = historicalData.map(item => item.volume);
        
        // Usar regressão linear simples para calcular tendência
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        
        for (let i = 0; i < volumes.length; i++) {
            sumX += i;
            sumY += volumes[i];
            sumXY += i * volumes[i];
            sumX2 += i * i;
        }
        
        const n = volumes.length;
        const denominator = n * sumX2 - sumX * sumX;
        
        if (denominator === 0) {
            return { 
                direction: 'neutra', 
                rate: 0,
                strength: 0 
            };
        }
        
        // Coeficiente de inclinação (slope)
        const b = (n * sumXY - sumX * sumY) / denominator;
        // Intercepto
        const a = (sumY - b * sumX) / n;
        
        // Calcular a tendência percentual diária média
        const firstValue = volumes[0] || 1; // Evitar divisão por zero
        const dailyChangeRate = b / firstValue;
        
        // Calcular o coeficiente de determinação (R²)
        let meanY = sumY / n;
        let SST = 0; // Total Sum of Squares
        let SSE = 0; // Error Sum of Squares
        
        for (let i = 0; i < volumes.length; i++) {
            const yPred = a + b * i;
            SST += Math.pow(volumes[i] - meanY, 2);
            SSE += Math.pow(volumes[i] - yPred, 2);
        }
        
        const rSquared = SST > 0 ? 1 - (SSE / SST) : 0;
        
        // Determinar direção e força da tendência
        let direction = 'neutra';
        if (dailyChangeRate > 0.005) direction = 'ascendente';
        else if (dailyChangeRate < -0.005) direction = 'descendente';
        
        return {
            direction,
            rate: dailyChangeRate,
            strength: rSquared
        };
    }

    /**
     * Obtém previsões de volume para os próximos dias
     * @param {string} productId - ID do produto
     * @param {string} targetDate - Data alvo para início das previsões
     * @param {number} daysForward - Número de dias para prever
     * @returns {Promise<Array>} Array com previsões diárias
     */
    async getPredictions(productId, targetDate, daysForward) {
        // Por padrão, usamos o novo método ensemble para melhores resultados
        return this.getPredictionsWithEnsemble(productId, targetDate, daysForward);
    }
}

module.exports = PredictiveAnalysisService; 