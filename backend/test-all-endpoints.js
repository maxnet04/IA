const axios = require('axios');

async function testAllEndpoints() {
    const baseURL = 'http://localhost:3000';
    const testDate = '2025-06-26';
    
    console.log('=== Teste Completo dos Endpoints Corrigidos ===\n');
    
    const results = {
        volume: { success: false, error: null },
        metrics: { success: false, error: null },
        recommendations: { success: false, error: null },
        anomalies: { success: false, error: null }
    };
    
    // Teste 1: Endpoint /volume
    console.log('1. Testando /api/predictive/volume...');
    try {
        const response1 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&groupId=ALL`);
        console.log('✅ Volume endpoint funcionando:', response1.data.success);
        results.volume.success = true;
    } catch (error) {
        console.log('❌ Volume endpoint falhou:', error.response?.data?.error || error.message);
        results.volume.error = error.response?.data?.error || error.message;
    }
    
    // Teste 2: Endpoint /metrics
    console.log('\n2. Testando /api/predictive/metrics...');
    try {
        const response2 = await axios.get(`${baseURL}/api/predictive/metrics?groupId=ALL`);
        console.log('✅ Metrics endpoint funcionando:', response2.data.success);
        results.metrics.success = true;
    } catch (error) {
        console.log('❌ Metrics endpoint falhou:', error.response?.data?.error || error.message);
        results.metrics.error = error.response?.data?.error || error.message;
    }
    
    // Teste 3: Endpoint /recommendations
    console.log('\n3. Testando /api/predictive/recommendations...');
    try {
        const response3 = await axios.get(`${baseURL}/api/predictive/recommendations?groupId=ALL&date=${testDate}`);
        console.log('✅ Recommendations endpoint funcionando:', response3.data.success);
        results.recommendations.success = true;
    } catch (error) {
        console.log('❌ Recommendations endpoint falhou:', error.response?.data?.error || error.message);
        results.recommendations.error = error.response?.data?.error || error.message;
    }
    
    // Teste 4: Endpoint /anomalies
    console.log('\n4. Testando /api/predictive/anomalies...');
    try {
        const response4 = await axios.get(`${baseURL}/api/predictive/anomalies?groupId=ALL`);
        console.log('✅ Anomalies endpoint funcionando:', response4.data.success);
        results.anomalies.success = true;
    } catch (error) {
        console.log('❌ Anomalies endpoint falhou:', error.response?.data?.error || error.message);
        results.anomalies.error = error.response?.data?.error || error.message;
    }
    
    // Teste 5: Compatibilidade com productId
    console.log('\n5. Testando compatibilidade com productId...');
    try {
        const response5 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&productId=PRODUTO_A`);
        console.log('✅ Compatibilidade com productId funcionando');
    } catch (error) {
        console.log('❌ Compatibilidade com productId falhou:', error.response?.data?.error || error.message);
    }
    
    // Relatório final
    console.log('\n=== RELATÓRIO FINAL ===');
    console.log('========================');
    
    const totalEndpoints = Object.keys(results).length;
    const successfulEndpoints = Object.values(results).filter(r => r.success).length;
    const successRate = (successfulEndpoints / totalEndpoints * 100).toFixed(1);
    
    console.log(`📊 Taxa de sucesso: ${successfulEndpoints}/${totalEndpoints} (${successRate}%)`);
    console.log('');
    
    Object.entries(results).forEach(([endpoint, result]) => {
        const status = result.success ? '✅ OK' : '❌ FALHOU';
        console.log(`${endpoint.toUpperCase()}: ${status}`);
        if (result.error) {
            console.log(`   Erro: ${result.error}`);
        }
    });
    
    console.log('========================');
    
    if (successfulEndpoints === totalEndpoints) {
        console.log('🎉 Todos os endpoints estão funcionando corretamente!');
        console.log('✅ Migração de productId para groupId concluída com sucesso!');
    } else {
        console.log('⚠️  Alguns endpoints ainda precisam de correção.');
        console.log('💡 Verifique os erros acima para mais detalhes.');
    }
    
    return results;
}

// Executar o teste
testAllEndpoints()
    .then(results => {
        console.log('\n🔍 Teste concluído. Resultados salvos em memória.');
    })
    .catch(error => {
        console.error('❌ Erro durante execução dos testes:', error.message);
    }); 