# Plano de Integração - Novas Funcionalidades SUAT IA

## 1. Introdução

Este documento descreve o plano detalhado para integrar as novas funcionalidades de análise preditiva com o backend do SUAT IA. As funcionalidades incluem:

- Simulação de Cenários
- Mapa de Calor Sazonal
- Fatores de Influência
- Comparação com Períodos Anteriores
- Recomendações Baseadas em Dados

A integração visa substituir os dados simulados por dados reais, melhorando significativamente o valor das análises preditivas para os usuários do sistema.

## 2. Escopo da Integração

### 2.1. Componentes Envolvidos

#### Backend
- Novos serviços para processamento de dados
- Novos controladores e endpoints de API
- Algoritmos de machine learning para análise preditiva

#### Frontend
- Hooks para consumo das novas APIs
- Adaptação dos componentes existentes
- Tratamento de estados de loading e erro

### 2.2. Requisitos Funcionais

- RF01: O sistema deve gerar múltiplos cenários preditivos (base, otimista, pessimista)
- RF02: O sistema deve analisar padrões de sazonalidade em diferentes dimensões temporais
- RF03: O sistema deve identificar e quantificar fatores de influência
- RF04: O sistema deve comparar períodos atuais com períodos anteriores
- RF05: O sistema deve gerar recomendações de ações baseadas nos dados analisados

### 2.3. Requisitos Não-Funcionais

- RNF01: Tempo de resposta máximo de 3 segundos para geração de cenários
- RNF02: Precisão mínima de 85% nas previsões de base
- RNF03: Disponibilidade de 99,5% para os serviços de API
- RNF04: Escalabilidade para processar até 5 anos de dados históricos

## 3. Arquitetura da Solução

### 3.1. Diagrama de Componentes

```
+------------------------+    +------------------------+    +-------------------------+
|    Frontend            |    |    API Gateway         |    |    Serviços Backend     |
|                        |    |                        |    |                         |
| +------------------+   |    | +------------------+   |    | +-------------------+   |
| | Componentes de   |   |    | | Controladores    |   |    | | Algoritmos de ML  |   |
| | Visualização     |<--+--->| | REST             |<--+--->| | e Processamento   |   |
| +------------------+   |    | +------------------+   |    | +-------------------+   |
|                        |    |                        |    |                         |
| +------------------+   |    | +------------------+   |    | +-------------------+   |
| | Hooks de         |   |    | | Middleware de    |   |    | | Repositório de    |   |
| | Integração API   |<--+--->| | Autenticação     |<--+--->| | Dados             |   |
| +------------------+   |    | +------------------+   |    | +-------------------+   |
+------------------------+    +------------------------+    +-------------------------+
```

### 3.2. Fluxo de Dados

1. O usuário interage com os componentes de visualização
2. Os hooks de API são acionados para buscar dados
3. Requisições são enviadas aos endpoints REST
4. Os controladores direcionam para os serviços adequados
5. Os serviços processam os dados usando algoritmos de ML
6. Os resultados são retornados através da API
7. Os hooks atualizam o estado dos componentes
8. A interface é atualizada com os dados processados

## 4. APIs Necessárias

### 4.1. Endpoint de Simulação de Cenários

```
GET /api/predictive/scenarios
```

#### Parâmetros

| Nome              | Tipo    | Obrigatório | Descrição                                     |
|-------------------|---------|-------------|-----------------------------------------------|
| productId         | String  | Sim         | Identificador do produto para análise         |
| baseDate          | Date    | Sim         | Data de referência para previsão              |
| monthsBack        | Integer | Não         | Meses anteriores para análise (padrão: 3)     |
| monthsForward     | Integer | Não         | Meses futuros para previsão (padrão: 2)       |
| optimisticFactor  | Float   | Não         | % de aumento para cenário otimista (padrão: 15)|
| pessimisticFactor | Float   | Não         | % de redução para cenário pessimista (padrão: 10)|
| riskLevel         | String  | Não         | Nível de risco (low, medium, high)            |

#### Resposta

```json
{
  "success": true,
  "data": {
    "baseScenario": [
      {
        "date": "2023-05-15",
        "predictedVolume": 120,
        "confidence": 0.85,
        "confidenceUpper": 138,
        "confidenceLower": 102
      }
    ],
    "optimisticScenario": [],
    "pessimisticScenario": [],
    "metadata": {
      "baselineMetrics": {
        "totalVolume": 1240,
        "avgDailyVolume": 41.3
      },
      "optimisticImpact": 15.2,
      "pessimisticImpact": -10.5,
      "riskAssessment": "MEDIUM"
    }
  }
}
```

### 4.2. Endpoint de Análise de Sazonalidade

```
GET /api/predictive/seasonality
```

#### Parâmetros

| Nome       | Tipo    | Obrigatório | Descrição                                              |
|------------|---------|-------------|--------------------------------------------------------|
| productId  | String  | Sim         | Identificador do produto                               |
| startDate  | Date    | Sim         | Data inicial para análise                              |
| endDate    | Date    | Sim         | Data final para análise                                |
| groupBy    | String  | Não         | Agrupamento (day_of_week, month, hour, week_of_year)   |

#### Resposta

```json
{
  "success": true,
  "data": {
    "heatmapData": [
      {
        "month": "Jan",
        "Dom": 45,
        "Seg": 87,
        "Ter": 92,
        "Qua": 85,
        "Qui": 110,
        "Sex": 105,
        "Sáb": 52
      }
    ],
    "insights": {
      "peakDays": ["Qui", "Sex"],
      "peakMonths": ["Mai", "Nov", "Dez"],
      "lowestPeriods": [],
      "seasonalityStrength": 0.72
    }
  }
}
```

### 4.3. Endpoint de Fatores de Influência

```
GET /api/predictive/influenceFactors
```

#### Parâmetros

| Nome       | Tipo    | Obrigatório | Descrição                  |
|------------|---------|-------------|----------------------------|
| productId  | String  | Sim         | Identificador do produto   |
| startDate  | Date    | Sim         | Data inicial para análise  |
| endDate    | Date    | Sim         | Data final para análise    |

#### Resposta

```json
{
  "success": true,
  "data": {
    "factors": [
      {
        "name": "Sazonalidade",
        "impact": 0.75,
        "description": "Padrões sazonais detectados nos dados históricos"
      }
    ],
    "correlationMatrix": []
  }
}
```

### 4.4. Endpoint de Comparação com Períodos Anteriores

```
GET /api/predictive/periodComparison
```

#### Parâmetros

| Nome              | Tipo    | Obrigatório | Descrição                                      |
|-------------------|---------|-------------|------------------------------------------------|
| productId         | String  | Sim         | Identificador do produto                       |
| currentPeriodStart| Date    | Sim         | Data inicial do período atual                  |
| currentPeriodEnd  | Date    | Sim         | Data final do período atual                    |
| comparisonType    | String  | Não         | Tipo de comparação (year_over_year, etc.)      |
| customPeriodStart | Date    | Não         | Data inicial do período personalizado          |
| customPeriodEnd   | Date    | Não         | Data final do período personalizado            |

#### Resposta

```json
{
  "success": true,
  "data": {
    "currentPeriod": [],
    "previousPeriod": [],
    "comparison": {
      "overallGrowth": 18.6,
      "highestDifference": {},
      "lowestDifference": {}
    }
  }
}
```

### 4.5. Endpoint de Recomendações

```
GET /api/predictive/recommendations
```

#### Parâmetros

| Nome       | Tipo    | Obrigatório | Descrição                                   |
|------------|---------|-------------|---------------------------------------------|
| productId  | String  | Sim         | Identificador do produto                    |
| date       | Date    | Sim         | Data para recomendações                     |
| limit      | Integer | Não         | Número máximo de recomendações (padrão: 3)  |

#### Resposta

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "title": "Planejamento de Estoque",
        "description": "Aumente o estoque em 15% para os meses de maior volume previsto (Maio-Junho) para evitar ruptura.",
        "priority": "Alta",
        "category": "Estoque",
        "impactPercentage": 12.5,
        "supportingEvidence": []
      }
    ]
  }
}
```

## 5. Implementação Backend

### 5.1. Serviços e Algoritmos

#### 5.1.1. ScenarioService

```javascript
class ScenarioService {
  async generateScenarios(productId, baseDate, options) {
    // Implementação do algoritmo de geração de cenários
  }
  
  calculateConfidenceIntervals(data, riskLevel) {
    // Cálculo de intervalos de confiança
  }
  
  async getHistoricalData(productId, fromDate, toDate) {
    // Busca dados históricos
  }
  
  async predictFutureData(historicalData, months, modelType = 'ARIMA') {
    // Aplica modelo de previsão
  }
  
  applyScenarioFactors(baseScenario, factors) {
    // Aplica fatores aos cenários
  }
}
```

#### 5.1.2. SeasonalityService

```javascript
class SeasonalityService {
  async analyzeSeasonality(productId, startDate, endDate, groupBy) {
    // Análise de sazonalidade
  }
  
  generateSeasonalInsights(data) {
    // Geração de insights
  }
  
  createHeatmapData(data, groupBy) {
    // Criação de dados para mapa de calor
  }
}
```

#### 5.1.3. InfluenceFactorsService

```javascript
class InfluenceFactorsService {
  async analyzeFactors(productId, period) {
    // Análise de fatores de influência
  }
  
  calculateCorrelations(data, factors) {
    // Cálculo de correlações
  }
  
  rankFactorsByImpact(factors) {
    // Ordenação de fatores por impacto
  }
}
```

#### 5.1.4. ComparisonService

```javascript
class ComparisonService {
  async comparePeriods(productId, currentPeriod, previousPeriod, comparisonType) {
    // Comparação de períodos
  }
  
  calculateGrowthMetrics(currentData, previousData) {
    // Cálculo de métricas de crescimento
  }
}
```

#### 5.1.5. RecommendationEngine

```javascript
class RecommendationEngine {
  async generateRecommendations(productId, date, limit) {
    // Geração de recomendações
  }
  
  prioritizeRecommendations(recommendations) {
    // Priorização de recomendações
  }
  
  findEvidenceForRecommendation(recommendation, data) {
    // Busca de evidências para recomendações
  }
}
```

### 5.2. Controladores

```javascript
class PredictiveController {
  async getScenarios(req, res) {
    // Controlador para cenários
  }
  
  async getSeasonality(req, res) {
    // Controlador para sazonalidade
  }
  
  async getInfluenceFactors(req, res) {
    // Controlador para fatores de influência
  }
  
  async getPeriodComparison(req, res) {
    // Controlador para comparação de períodos
  }
  
  async getRecommendations(req, res) {
    // Controlador para recomendações
  }
}
```

### 5.3. Rotas

```javascript
const router = express.Router();
const predictiveController = new PredictiveController();

router.get('/scenarios', predictiveController.getScenarios);
router.get('/seasonality', predictiveController.getSeasonality);
router.get('/influenceFactors', predictiveController.getInfluenceFactors);
router.get('/periodComparison', predictiveController.getPeriodComparison);
router.get('/recommendations', predictiveController.getRecommendations);

module.exports = router;
```

## 6. Implementação Frontend

### 6.1. Hooks de Integração

#### 6.1.1. useScenarios.js

```javascript
import { useState, useEffect } from 'react';
import api from '../infrastructure/api';

export default function useScenarios(productId, baseDate, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  
  const loadScenarios = async (productId, baseDate, options) => {
    // Implementação da chamada à API
  };
  
  useEffect(() => {
    // Efeito para carregar dados
  }, [productId, baseDate]);
  
  return { scenarios, loading, error, loadScenarios };
}
```

#### 6.1.2. useSeasonality.js

```javascript
export default function useSeasonality(productId, startDate, endDate, groupBy = 'day_of_week') {
  // Implementação similar ao hook de cenários
}
```

#### 6.1.3. useInfluenceFactors.js

```javascript
export default function useInfluenceFactors(productId, startDate, endDate) {
  // Implementação similar ao hook de cenários
}
```

#### 6.1.4. usePeriodComparison.js

```javascript
export default function usePeriodComparison(productId, currentPeriod, comparisonOptions) {
  // Implementação similar ao hook de cenários
}
```

#### 6.1.5. useRecommendations.js

```javascript
export default function useRecommendations(productId, date, limit = 3) {
  // Implementação similar ao hook de cenários
}
```

### 6.2. Adaptação dos Componentes

#### 6.2.1. Componente de Simulação de Cenários

```jsx
// No componente
const { scenarios, loading, error, loadScenarios } = useScenarios();

// Em vez de usar dados simulados, usar os dados da API
useEffect(() => {
  if (productId && selectedDate) {
    loadScenarios(productId, format(selectedDate, 'yyyy-MM-dd'), {
      monthsBack,
      monthsForward,
      optimisticFactor: scenarioParams.optimistic,
      pessimisticFactor: scenarioParams.pessimistic,
      riskLevel: scenarioParams.riskFactor
    });
  }
}, [productId, selectedDate, scenarioParams, monthsBack, monthsForward]);

// Renderização com dados da API
{(selectedScenario === 'base' || selectedScenario === 'all') && (
  <Line 
    data={scenarios?.baseScenario || []}
    type="monotone" 
    dataKey="predictedVolume"
    name="Cenário Base"
    stroke="#673ab7" 
    strokeWidth={2}
    dot={{ r: 4 }}
  />
)}
```

#### 6.2.2. Componente de Mapa de Calor Sazonal

```jsx
const { seasonalityData, loading, error } = useSeasonality(
  productId, 
  format(subMonths(selectedDate, monthsBack), 'yyyy-MM-dd'),
  format(selectedDate, 'yyyy-MM-dd'),
  'day_of_week'
);

// Renderização com dados da API
<BarChart
  data={seasonalityData?.heatmapData || []}
  layout="vertical"
  // ...outras props
>
  {/* ... */}
</BarChart>

// Insights dinâmicos
<Typography variant="body1">
  <b>Dias de Pico:</b> {seasonalityData?.insights?.peakDays?.join(', ') || 'Carregando...'}
</Typography>
```

## 7. Plano de Implementação

### 7.1. Cronograma Detalhado

#### Fase 1: Desenvolvimento do Backend (3 semanas)

**Semana 1: Implementação de Serviços**
- Dia 1-2: Desenvolvimento do ScenarioService
- Dia 3-4: Desenvolvimento do SeasonalityService
- Dia 5: Desenvolvimento do InfluenceFactorsService

**Semana 2: Controladores e Endpoints**
- Dia 1-2: Implementação do PredictiveController
- Dia 3: Configuração de rotas
- Dia 4-5: Testes unitários

**Semana 3: Refinamento e Integração**
- Dia 1-2: Otimização de algoritmos
- Dia 3-4: Testes de integração
- Dia 5: Documentação da API

#### Fase 2: Desenvolvimento do Frontend (2 semanas)

**Semana 1: Hooks e Integração Básica**
- Dia 1-2: Desenvolvimento dos hooks
- Dia 3-5: Adaptação do componente de Simulação de Cenários

**Semana 2: Integração Completa**
- Dia 1-2: Adaptação do componente de Mapa de Calor Sazonal
- Dia 3-4: Adaptação dos componentes de Fatores e Recomendações
- Dia 5: Testes e ajustes de UI

#### Fase 3: Testes e Implantação (1 semana)

- Dia 1-2: Testes de carga e desempenho
- Dia 3: Validação de precisão
- Dia 4: Preparação do ambiente de produção
- Dia 5: Implantação e monitoramento inicial

### 7.2. Responsabilidades

| Responsabilidade | Perfil Recomendado |
|------------------|---------------------|
| Serviços Backend | Desenvolvedor Backend Senior com experiência em algoritmos de ML |
| Controladores API | Desenvolvedor Backend |
| Hooks Frontend | Desenvolvedor Frontend com experiência em React |
| Componentes | Desenvolvedor Frontend com experiência em visualização de dados |
| Testes | QA com experiência em sistemas analíticos |
| DevOps | Engenheiro DevOps |

### 7.3. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Baixa precisão das previsões | Média | Alto | Validação com dados históricos reais; ajuste de modelos |
| Desempenho insatisfatório | Média | Médio | Otimização de algoritmos; cache de resultados frequentes |
| Complexidade da integração | Alta | Médio | Desenvolvimento iterativo; testes contínuos |
| Falhas na API | Baixa | Alto | Tratamento robusto de erros; fallbacks para dados locais |

## 8. Métricas de Sucesso

- Precisão de previsões >= 85%
- Tempo de resposta dos endpoints < 3 segundos
- Cobertura de testes > 80%
- Feedback positivo dos usuários > 80%

## 9. Considerações Finais

A integração proposta transforma as funcionalidades simuladas em ferramentas de análise baseadas em dados reais, agregando valor significativo ao SUAT IA. O design modular permite implementação incremental e facilita a manutenção futura.

As APIs foram projetadas considerando:
- Consistência de interface
- Facilidade de uso
- Desempenho
- Escalabilidade

A arquitetura proposta está alinhada com o modelo existente do SUAT IA, mantendo a separação clara entre camadas e a aderência aos princípios de Clean Architecture. 