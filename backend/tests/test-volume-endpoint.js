const axios = require('axios');

async function testVolumeEndpoint() {
    const baseURL = 'http://localhost:3000';
    const testDate = '2025-06-26';
    
    console.log('=== Teste do Endpoint /api/predictive/volume ===');
    
    try {
        // Teste 1: Com groupId=ALL
        console.log('\n1. Testando com groupId=ALL...');
        const response1 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&groupId=ALL`);
        console.log('✅ Sucesso com groupId:', response1.data);
        
        // Teste 2: Com productId (compatibilidade)
        console.log('\n2. Testando com productId=PRODUTO_A...');
        const response2 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&productId=PRODUTO_A`);
        console.log('✅ Sucesso com productId:', response2.data);
        
        // Teste 3: Sem date (deve dar erro)
        console.log('\n3. Testando sem date (deve falhar)...');
        try {
            const response3 = await axios.get(`${baseURL}/api/predictive/volume?groupId=ALL`);
            console.log('❌ Esperado erro, mas recebeu:', response3.data);
        } catch (error) {
            console.log('✅ Erro esperado:', error.response?.data?.error);
        }
        
        // Teste 4: Sem groupId nem productId (deve dar erro)
        console.log('\n4. Testando sem groupId nem productId (deve falhar)...');
        try {
            const response4 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}`);
            console.log('❌ Esperado erro, mas recebeu:', response4.data);
        } catch (error) {
            console.log('✅ Erro esperado:', error.response?.data?.error);
        }
        
        // Teste 5: Com ambos os parâmetros (groupId deve ter prioridade)
        console.log('\n5. Testando com ambos groupId e productId (groupId deve ter prioridade)...');
        const response5 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&groupId=SEGURANÇA&productId=PRODUTO_A`);
        console.log('✅ Sucesso com ambos (groupId prioritário):', response5.data);
        
        // Teste 6: Com grupo específico
        console.log('\n6. Testando com grupo específico (DESENVOLVIMENTO)...');
        const response6 = await axios.get(`${baseURL}/api/predictive/volume?date=${testDate}&groupId=DESENVOLVIMENTO`);
        console.log('✅ Sucesso com grupo específico:', response6.data);
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

// Executar o teste
testVolumeEndpoint(); 