const axios = require('axios');

const baseURL = 'http://localhost:3001';

async function testNotifications() {
    console.log('=== Teste do Sistema de Notificações ===\n');

    try {
        // 1. Testar detecção de anomalias (que deve gerar notificações)
        console.log('1. Testando detecção de anomalias (deve gerar notificações automáticas)...');
        const anomaliesResponse = await axios.get(`${baseURL}/api/predictive/anomalies`, {
            params: { groupId: 'ALL', severity: 'alta', limit: 3 },
            headers: { Authorization: 'Bearer test-token' }
        });
        console.log('✅ Anomalias detectadas:', anomaliesResponse.data.data?.anomalies?.length || 0);

        // 2. Testar busca de notificações
        console.log('\n2. Testando busca de notificações...');
        const notificationsResponse = await axios.get(`${baseURL}/api/predictive/notifications`, {
            params: { groupId: 'ALL' },
            headers: { Authorization: 'Bearer test-token' }
        });
        console.log('✅ Notificações encontradas:', notificationsResponse.data.data?.length || 0);
        
        if (notificationsResponse.data.data?.length > 0) {
            console.log('📋 Primeira notificação:', {
                title: notificationsResponse.data.data[0].title,
                message: notificationsResponse.data.data[0].description,
                type: notificationsResponse.data.data[0].type,
                severity: notificationsResponse.data.data[0].severity
            });
        }

        // 3. Testar previsão com baixa confiança (deve gerar notificação)
        console.log('\n3. Testando previsão de volume...');
        const predictionResponse = await axios.get(`${baseURL}/api/predictive/volume`, {
            params: { date: '2025-01-28', groupId: 'ALL' },
            headers: { Authorization: 'Bearer test-token' }
        });
        console.log('✅ Previsão gerada com confiança:', 
            Math.round((predictionResponse.data.data?.confidence || 0) * 100) + '%');

        // 4. Testar marcar notificação como lida
        if (notificationsResponse.data.data?.length > 0) {
            const firstNotificationId = notificationsResponse.data.data[0].id;
            console.log('\n4. Testando marcar notificação como lida...');
            
            const markReadResponse = await axios.put(
                `${baseURL}/api/predictive/notifications/${firstNotificationId}/read`,
                {},
                { headers: { Authorization: 'Bearer test-token' } }
            );
            console.log('✅ Notificação marcada como lida:', markReadResponse.data.success);
        }

        // 5. Testar marcar todas como lidas
        console.log('\n5. Testando marcar todas notificações como lidas...');
        const markAllReadResponse = await axios.put(
            `${baseURL}/api/predictive/notifications/mark-all-read`,
            {},
            { 
                params: { groupId: 'ALL' },
                headers: { Authorization: 'Bearer test-token' } 
            }
        );
        console.log('✅ Todas notificações marcadas como lidas:', 
            markAllReadResponse.data.data?.updatedCount || 0, 'notificações');

        console.log('\n🎉 Todos os testes de notificações passaram!');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    }
}

// Executar teste
testNotifications(); 