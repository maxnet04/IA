const express = require('express');
const cors = require('cors');

// Contador de chamadas para cada endpoint
const callCounts = {
    '/api/predictive/metrics': 0,
    '/api/predictive/volume': 0,
    '/api/predictive/anomalies': 0,
    '/api/predictive/recommendations': 0,
    '/api/incidents/timeline': 0
};

// Middleware para contar chamadas
const callCounter = (req, res, next) => {
    const endpoint = req.path;
    
    // Incrementa contador se for um dos endpoints monitorados
    if (callCounts.hasOwnProperty(endpoint)) {
        callCounts[endpoint]++;
        console.log(`📊 [${new Date().toISOString()}] ${req.method} ${endpoint} - Chamada #${callCounts[endpoint]}`);
        
        // Se for metrics e for a segunda chamada em menos de 5 segundos, alerta
        if (endpoint === '/api/predictive/metrics' && callCounts[endpoint] === 2) {
            console.log('⚠️  ALERTA: Chamada duplicada detectada para /api/predictive/metrics');
        }
    }
    
    next();
};

// Função para resetar contadores
const resetCounters = () => {
    Object.keys(callCounts).forEach(key => {
        callCounts[key] = 0;
    });
    console.log('🔄 Contadores resetados');
};

// Função para exibir relatório
const showReport = () => {
    console.log('\n📈 RELATÓRIO DE CHAMADAS:');
    console.log('==========================');
    Object.entries(callCounts).forEach(([endpoint, count]) => {
        const status = count > 1 ? '⚠️  DUPLICADO' : '✅ OK';
        console.log(`${endpoint}: ${count} chamadas ${status}`);
    });
    console.log('==========================\n');
};

// Configurar servidor de monitoramento
const app = express();
app.use(cors());
app.use(callCounter);

// Endpoint para obter estatísticas
app.get('/monitor/stats', (req, res) => {
    res.json({
        callCounts,
        timestamp: new Date().toISOString(),
        duplicates: Object.entries(callCounts).filter(([_, count]) => count > 1)
    });
});

// Endpoint para resetar contadores
app.post('/monitor/reset', (req, res) => {
    resetCounters();
    res.json({ message: 'Contadores resetados', timestamp: new Date().toISOString() });
});

// Simular endpoints da API principal
app.get('/api/predictive/metrics', (req, res) => {
    res.json({ success: true, data: { message: 'Metrics endpoint - teste' } });
});

app.get('/api/predictive/volume', (req, res) => {
    res.json({ success: true, data: { message: 'Volume endpoint - teste' } });
});

app.get('/api/predictive/anomalies', (req, res) => {
    res.json({ success: true, data: { message: 'Anomalies endpoint - teste' } });
});

app.get('/api/predictive/recommendations', (req, res) => {
    res.json({ success: true, data: { message: 'Recommendations endpoint - teste' } });
});

app.get('/api/incidents/timeline', (req, res) => {
    res.json({ success: true, data: { message: 'Timeline endpoint - teste' } });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🔍 Monitor de chamadas rodando na porta ${PORT}`);
    console.log('📊 Monitorando endpoints da dashboard...');
    console.log('🌐 Acesse http://localhost:3001/monitor/stats para ver estatísticas');
    
    // Exibir relatório a cada 10 segundos
    setInterval(showReport, 10000);
    
    // Resetar contadores a cada 30 segundos
    setInterval(resetCounters, 30000);
});

console.log('🚀 Script de monitoramento iniciado!');
console.log('💡 Dica: Abra a dashboard em http://localhost:3000 e observe as chamadas aqui'); 