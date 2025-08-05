const axios = require('axios');

async function testMetricsEndpoint() {
    const baseURL = 'http://localhost:3000';
    
    console.log('=== Teste do Endpoint /api/predictive/metrics ===');
    
    try {
        // Teste 1: Com groupId
        console.log('\n1. Testando com groupId=ALL...');
        const response1 = await axios.get(`${baseURL}/api/predictive/metrics?groupId=ALL`);
        console.log('✅ Sucesso com groupId:', response1.data);
        
        // Teste 2: Com productId (compatibilidade)
        console.log('\n2. Testando com productId=PRODUTO_A...');
        const response2 = await axios.get(`${baseURL}/api/predictive/metrics?productId=PRODUTO_A`);
        console.log('✅ Sucesso com productId:', response2.data);
        
        // Teste 3: Sem parâmetros (deve dar erro)
        console.log('\n3. Testando sem parâmetros (deve falhar)...');
        try {
            const response3 = await axios.get(`${baseURL}/api/predictive/metrics`);
            console.log('❌ Esperado erro, mas recebeu:', response3.data);
        } catch (error) {
            console.log('✅ Erro esperado:', error.response?.data?.error);
        }
        
        // Teste 4: Com ambos os parâmetros (groupId deve ter prioridade)
        console.log('\n4. Testando com ambos groupId e productId (groupId deve ter prioridade)...');
        const response4 = await axios.get(`${baseURL}/api/predictive/metrics?groupId=SEGURANÇA&productId=PRODUTO_A`);
        console.log('✅ Sucesso com ambos (groupId prioritário):', response4.data);
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Executar o teste
testMetricsEndpoint(); 