const RecommendationService = require('./src/services/RecommendationService');

async function testRecommendations() {
  const service = new RecommendationService();
  
  try {
    console.log('Testando recomendações para PRODUTO_B:');
    const resultB = await service.generateRecommendations('PRODUTO_B', '2023-12-01');
    console.log('SUCESSO! Número de recomendações:', resultB.data.recommendations.length);
    console.log('Recomendações:', JSON.stringify(resultB.data.recommendations, null, 2));
    
    console.log('\n\nTestando recomendações para ALL:');
    const resultAll = await service.generateRecommendations('ALL', '2023-12-01');
    console.log('SUCESSO! Número de recomendações:', resultAll.data.recommendations.length);
    console.log('Recomendações:', JSON.stringify(resultAll.data.recommendations, null, 2));
  } catch (error) {
    console.error('ERRO NO TESTE:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Executar o teste
testRecommendations(); 