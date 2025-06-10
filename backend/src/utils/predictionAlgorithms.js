/**
 * Algoritmos de predição para análise de volume
 */

/**
 * Predição usando modelo de regressão linear
 * @param {Array} historicalData Dados históricos
 * @returns {Object} Predição calculada
 */
function predictLinearRegression(historicalData) {
    if (!historicalData || historicalData.length < 2) {
        return { volume: 0, confidence: 0 };
    }

    // Implementação simples de regressão linear
    const n = historicalData.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = historicalData.map(d => d.volume);

    // Calcular médias
    const avgX = x.reduce((sum, val) => sum + val, 0) / n;
    const avgY = y.reduce((sum, val) => sum + val, 0) / n;

    // Calcular coeficientes
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (x[i] - avgX) * (y[i] - avgY);
        denominator += Math.pow(x[i] - avgX, 2);
    }

    const b = denominator !== 0 ? numerator / denominator : 0;
    const a = avgY - b * avgX;

    // Predição para o próximo ponto
    const predictedVolume = a + b * n;
    
    // Calcular coeficiente de determinação (R²) para confiança
    const yPred = x.map(xi => a + b * xi);
    const sse = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const sst = y.reduce((sum, yi) => sum + Math.pow(yi - avgY, 2), 0);
    const r2 = sst !== 0 ? 1 - (sse / sst) : 0;

    return {
        volume: Math.max(0, Math.round(predictedVolume)),
        confidence: Math.max(0.3, Math.min(0.9, r2))
    };
}

/**
 * Predição usando modelo ARIMA simplificado
 * @param {Array} historicalData Dados históricos
 * @returns {Object} Predição calculada
 */
function predictARIMA(historicalData) {
    if (!historicalData || historicalData.length < 5) {
        return { volume: 0, confidence: 0 };
    }

    // Simplificação do ARIMA - usando média móvel com peso maior para dados recentes
    const n = historicalData.length;
    const recentData = historicalData.slice(-5);
    
    // Pesos: dados mais recentes têm peso maior
    const weights = [0.1, 0.15, 0.2, 0.25, 0.3];
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < recentData.length; i++) {
        weightedSum += recentData[i].volume * weights[i];
        weightSum += weights[i];
    }
    
    const predictedVolume = weightSum > 0 ? weightedSum / weightSum : 0;
    
    // Confiança baseada na variabilidade dos dados
    const volumes = historicalData.map(d => d.volume);
    const mean = volumes.reduce((acc, vol) => acc + vol, 0) / volumes.length;
    const variance = volumes.reduce((acc, vol) => acc + Math.pow(vol - mean, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1; // Coeficiente de variação
    
    // Menor variação = maior confiança
    const confidence = Math.max(0.3, Math.min(0.9, 1 - cv));
    
    return {
        volume: Math.max(0, Math.round(predictedVolume)),
        confidence: confidence
    };
}

/**
 * Predição usando média móvel simples
 * @param {Array} historicalData Dados históricos
 * @returns {Object} Predição calculada
 */
function predictMovingAverage(historicalData) {
    if (!historicalData || historicalData.length === 0) {
        return { volume: 0, confidence: 0 };
    }

    // Usar os últimos 7 dias ou menos se não houver dados suficientes
    const period = Math.min(7, historicalData.length);
    const recentData = historicalData.slice(-period);
    
    // Calcular média
    const sum = recentData.reduce((acc, d) => acc + d.volume, 0);
    const avg = sum / period;
    
    // Confiança diminui com menor quantidade de dados
    const confidence = Math.max(0.3, Math.min(0.8, period / 7));
    
    return {
        volume: Math.max(0, Math.round(avg)),
        confidence: confidence
    };
}

module.exports = {
    predictLinearRegression,
    predictARIMA,
    predictMovingAverage
}; 