const axios = require('axios');

// Função para fazer login e obter o token
async function login() {
  try {
    console.log('Fazendo login para obter token...');
    
    // Tenta diferentes combinações de credenciais
    const credentials = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'admin', password: '123456' }
    ];
    
    for (const cred of credentials) {
      try {
        console.log(`Tentando login com usuário: ${cred.username}`);
        const response = await axios.post('http://localhost:3001/api/auth/login', cred);
        
        if (response.data && response.data.data && response.data.data.token) {
          console.log('Login bem-sucedido! Token obtido.');
          return response.data.data.token;
        }
      } catch (e) {
        console.log(`Falha na tentativa com usuário: ${cred.username}`);
      }
    }
    
    throw new Error('Todas as tentativas de login falharam.');
  } catch (error) {
    console.error('Erro no processo de login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Função para testar o endpoint
async function testVolumeEndpoint(token) {
  try {
    console.log('Testando o endpoint /api/predictive/volume...');
    
    const response = await axios.get('http://localhost:3001/api/predictive/volume', {
      params: {
        date: '2025-04-16',
        productId: 'ALL'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
    return true;
  } catch (error) {
    console.error('Erro ao testar o endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Função para testar outros endpoints predictive
async function testOtherEndpoints(token) {
  try {
    console.log('\nTestando o endpoint /api/predictive/anomalies...');
    
    const response = await axios.get('http://localhost:3001/api/predictive/anomalies', {
      params: {
        productId: 'PROD001'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
    return true;
  } catch (error) {
    console.error('Erro ao testar o endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Executa o teste
async function runTests() {
  const token = await login();
  
  if (!token) {
    console.log('Não foi possível obter o token. Testes cancelados.');
    return;
  }
  
  console.log('Token:', token);
  
  const success1 = await testVolumeEndpoint(token);
  const success2 = await testOtherEndpoints(token);
  
  console.log(success1 && success2 ? 'Todos os testes concluídos com sucesso!' : 'Alguns testes falharam.');
}

runTests(); 