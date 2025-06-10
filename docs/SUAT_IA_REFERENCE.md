# SUAT IA - Sistema Unificado de Análise e Tratamento de Incidentes (POC)

## Visão Geral

O SUAT IA é um sistema de análise preditiva e geração de insights que consome dados de um sistema de tratamento de incidentes existente. O foco do SUAT IA é exclusivamente em:
- Análise preditiva de padrões de incidentes
- Geração de insights e recomendações
- Visualização de dados
- Detecção de anomalias

## Modelo de Dados

### Estrutura de Dados Consumidos do Sistema de Incidentes

| Campo | Tipo | Descrição | Uso em IA |
|-------|------|-----------|-----------|
| INCIDENTE | String | Identificador único do incidente | Agrupamento e análise temporal |
| CATEGORIA | String | Categoria de classificação | Classificação e correlação |
| GRUPO_ATUAL | String | Grupo responsável atual | Análise de performance |
| GRUPO_DIRECIONADO | String | Grupo final de direcionamento | Análise de fluxo e eficiência |
| DATA_CRIACAO | DateTime | Data e hora de criação | Análise temporal |
| PRIORIDADE | Enum | Nível de prioridade | Correlação com outros fatores |
| PROBLEMA | Text | Descrição detalhada | NLP e extração de padrões |
| SOLUCAO | Text | Solução aplicada | Base de conhecimento |
| DATA_ENCERRAMENTO | DateTime | Data de encerramento | Análise de tempo de resolução |
| USU_TRATAMENTO | String | Usuário que tratou o incidente | Análise de performance individual |
| ANALISE | Text | Análise para solução | Base de conhecimento e padrões |
| ACAO | Enum | Status final (CANCELADO/RESOLVIDO/DIRECIONADO) | Análise de efetividade |

## Análises Principais (POC)

### 1. Análise Temporal
- Padrões de ocorrência
- Tendências básicas
- Tempo médio de resolução
- Distribuição por ação e grupo

### 2. Análise Preditiva
- Previsão de volume
- Detecção de anomalias
- Recomendações básicas

### 3. Visualização
- Dashboard interativo
- Gráficos principais
- Métricas chave
- Filtros por grupo e ação

## Detecção de Anomalias

A detecção de anomalias é um componente crítico do SUAT IA que identifica padrões incomuns ou desvios significativos no comportamento dos incidentes. Esta funcionalidade permite a identificação precoce de problemas potenciais no sistema e fornece insights valiosos para tomada de decisão.

### O que são Anomalias no Contexto de Incidentes

No SUAT IA, anomalias são definidas como eventos ou padrões que se desviam significativamente do comportamento normal ou esperado, considerando o histórico de incidentes. Estas anomalias podem se manifestar de diversas formas:

1. **Anomalias de Volume**:
   - Picos ou quedas repentinas no número de incidentes
   - Variações significativas em relação à média histórica
   - Padrões cíclicos interrompidos ou alterados

2. **Anomalias de Tempo**:
   - Incidentes com tempo de resolução muito acima do esperado
   - Variações anormais no tempo médio de resolução por categoria ou grupo
   - Atrasos sistemáticos em determinados tipos de incidentes

3. **Anomalias de Distribuição**:
   - Mudanças abruptas na distribuição de incidentes por grupos
   - Alterações no padrão de ações finais (CANCELADO/RESOLVIDO/DIRECIONADO)
   - Concentração incomum em determinadas categorias

4. **Anomalias de Correlação**:
   - Relações inesperadas entre diferentes variáveis
   - Quebra de padrões conhecidos de correlação

### Tipos Específicos de Anomalias Detectadas

O sistema implementa detecção específica para os seguintes padrões de anomalias:

1. **VOLUME_SPIKE (Picos de Volume)**
   - **Descrição**: Aumentos súbitos e significativos no volume de incidentes
   - **Características**:
     - Aumento de 3-5x acima do volume normal
     - Probabilidade de ocorrência: 5% por dia
     - Severidade: Geralmente ALTA quando o desvio é maior que 3σ
   - **Uso**: Detecção de incidentes críticos ou problemas graves que causam picos repentinos

2. **VOLUME_DROP (Quedas de Volume)**
   - **Descrição**: Quedas abruptas no volume de incidentes
   - **Características**:
     - Redução para 10-30% do volume normal
     - Probabilidade de ocorrência: 5% por dia
     - Severidade: Varia conforme a duração e intensidade da queda
   - **Uso**: Identificação de problemas na coleta de dados ou interrupções de serviço

3. **SUSTAINED_INCREASE (Aumento Sustentado)**
   - **Descrição**: Aumento persistente no volume de incidentes por múltiplos dias
   - **Características**:
     - Volume 2x maior que o normal
     - Duração de 3 dias consecutivos
     - Probabilidade de início: 3% por dia
   - **Uso**: Detecção de problemas persistentes ou degradação gradual de sistemas

4. **CYCLIC_PATTERN (Padrão Cíclico)**
   - **Descrição**: Variações anormais em padrões cíclicos esperados
   - **Características**:
     - Variação senoidal com amplitude de 50% do volume base
     - Probabilidade de ocorrência: 10% por dia
   - **Uso**: Identificação de desvios em padrões sazonais normais

### Padrões Base e Sazonalidade

O sistema considera os seguintes padrões base para análise:

1. **Sazonalidade Semanal**
   - Volume em dias úteis: 100-150 incidentes
   - Volume em finais de semana: 30-50 incidentes
   - Usado como base para detecção de desvios

2. **Tendência de Crescimento**
   - Crescimento gradual de 50% ao longo do período analisado
   - Considerado na análise para evitar falsos positivos

### Metodologia de Detecção

O SUAT IA emprega várias técnicas para detectar anomalias nos dados de incidentes:

1. **Análise Estatística**:
   - Cálculo de médias móveis e desvios padrão
   - Estabelecimento de intervalos de confiança estatística (geralmente 2-3 desvios padrão)
   - Testes de hipótese para validar significância estatística de desvios

2. **Detecção de Outliers**:
   - Método de Z-score para identificação de valores atípicos
   - Algoritmos baseados em quartis (IQR - Interquartile Range)
   - Técnicas de densidade (LOF - Local Outlier Factor)

3. **Análise de Séries Temporais**:
   - Decomposição de séries temporais em componentes de tendência, sazonalidade e resíduo
   - Modelos ARIMA para previsão e detecção de anomalias
   - Janelas deslizantes para análise de padrões temporais

4. **Algoritmos de Aprendizado de Máquina**:
   - Modelos de classificação one-class SVM
   - Redes neurais autoencoder para detecção de anomalias
   - Algoritmos de clustering para identificar pontos distantes de clusters normais

### Endpoint de Anomalias

O endpoint `/predictive/anomalies` é responsável pela detecção e retorno de anomalias nos dados históricos de incidentes. Ele aceita os seguintes parâmetros:

- `productId`: Identificador do produto ou sistema para análise (ex: "ALL" para todos)
- `startDate`: Data inicial para análise (opcional)
- `endDate`: Data final para análise (opcional)
- `severity`: Filtro de severidade das anomalias (opcional, valores: 'ALTA', 'MÉDIA', 'BAIXA')
- `limit`: Número máximo de anomalias a retornar (opcional, padrão: sem limite)

> **Nota sobre o parâmetro de severidade**: Quando o parâmetro `severity` é fornecido, apenas as anomalias com a severidade especificada serão retornadas. Este parâmetro permite filtrar os resultados para mostrar apenas anomalias de alta criticidade (ALTA), média criticidade (MÉDIA) ou baixa criticidade (BAIXA). Esta funcionalidade é particularmente útil para dashboards que mostram apenas anomalias críticas ou para interfaces que permitem ao usuário filtrar anomalias por nível de importância.

#### Resposta do Endpoint

O endpoint retorna um objeto JSON com a seguinte estrutura:

```json
{
    "success": true,
    "data": {
        "anomalies": [
            {
                "id": "ANM-20250415-001",
                "type": "VOLUME_SPIKE",
                "description": "Aumento anormal de incidentes na categoria X",
                "date": "2025-04-15",
                "severity": "ALTA",
                "confidence": 0.92,
                "affectedGroups": ["INFRA", "SUPORTE_N2"],
                "metrics": {
                    "expected": 12,
                    "actual": 47,
                    "deviation": 291.67
                },
                "possibleCauses": ["Implantação de nova versão", "Falha em sistema de monitoramento"]
            }
        ],
        "threshold": 147.89,
        "period": {
            "start": "2025-04-01",
            "end": "2025-04-15"
        },
        "warning": "Dados históricos limitados (15/30 dias recomendados). Análise de anomalias pode não ser precisa."
    }
}
```

#### Campos da Resposta

- **anomalies**: Array de objetos representando cada anomalia detectada
  - **id**: Identificador único da anomalia
  - **type**: Tipo de anomalia (VOLUME_SPIKE, TIME_ANOMALY, DISTRIBUTION_SHIFT, etc.)
  - **description**: Descrição textual da anomalia
  - **date**: Data da ocorrência
  - **severity**: Severidade da anomalia (ALTA, MÉDIA, BAIXA)
  - **confidence**: Nível de confiança da detecção (0-1)
  - **affectedGroups**: Grupos afetados pela anomalia
  - **metrics**: Métricas relacionadas à anomalia
  - **possibleCauses**: Possíveis causas identificadas

- **threshold**: Limite estatístico utilizado para detecção
- **period**: Período analisado
- **warning**: Avisos sobre limitações na análise

### Visualização no Frontend

As anomalias detectadas são visualizadas no frontend através de:

1. **Cards de Resumo**: Exibição do número total de anomalias detectadas
2. **Listagem de Anomalias**: Tabela detalhada com filtros
3. **Destaques no Dashboard**: Indicadores visuais de anomalias recentes
4. **Gráficos com Marcadores**: Pontos anômalos destacados em gráficos de séries temporais

### Valor para o Negócio

A detecção de anomalias proporciona diversos benefícios:

1. **Identificação precoce de problemas**: Permite que equipes respondam a problemas antes que se tornem críticos
2. **Redução de tempo de inatividade**: Minimiza o impacto de problemas identificando-os em estágios iniciais
3. **Melhoria contínua**: Fornece insights sobre padrões anormais que podem indicar problemas sistêmicos
4. **Alocação eficiente de recursos**: Direciona atenção para áreas que estão apresentando comportamento anômalo
5. **Tomada de decisão baseada em dados**: Substitui suposições por evidências concretas de padrões anômalos

## Estrutura do Projeto

```
suat-ia-poc/
├── backend/
│   ├── src/
│   │   ├── domain/                 # Regras de negócio e entidades
│   │   │   ├── entities/
│   │   │   └── usecases/
│   │   │
│   │   ├── application/            # Casos de uso e regras da aplicação
│   │   │   ├── services/
│   │   │   ├── interfaces/
│   │   │   └── dto/
│   │   │
│   │   ├── infrastructure/         # Frameworks e ferramentas
│   │   │   ├── database/
│   │   │   ├── external/
│   │   │   └── config/
│   │   │
│   │   └── interfaces/             # Adaptadores de interface
│   │       ├── controllers/
│   │       ├── routes/
│   │       └── middlewares/
│   │
│   └── tests/                      # Testes unitários e integração
│
├── frontend/
│   ├── src/
│   │   ├── domain/                 # Regras de negócio frontend
│   │   │   ├── entities/
│   │   │   └── interfaces/
│   │   │
│   │   ├── application/            # Lógica da aplicação
│   │   │   ├── services/
│   │   │   └── hooks/
│   │   │
│   │   ├── infrastructure/         # Configurações e ferramentas
│   │   │   ├── api/
│   │   │   └── config/
│   │   │
│   │   └── presentation/           # Interface do usuário
│   │       ├── components/
│   │       ├── pages/
│   │       └── layouts/
│   │
│   └── tests/                      # Testes frontend
│
└── shared/                         # Código compartilhado
    ├── types/
    └── constants/ 
```

## Ferramentas de Teste e Simulação

### Script de Geração de Dados de Teste

O sistema inclui um script especializado (`backend/scripts/initDb.js`) para geração de dados de teste que simulam diferentes cenários de anomalias. Esta ferramenta é essencial para:

1. **Desenvolvimento e Testes**
   - Validação do sistema de detecção de anomalias
   - Testes de integração
   - Demonstrações e POCs
   - Desenvolvimento de novos algoritmos
   - Ajuste de parâmetros de detecção

2. **Características do Script**
   ```javascript
   const anomalyTypes = {
       VOLUME_SPIKE: {
           transform: (vol) => vol * (3 + Math.random() * 2),
           probability: 0.05
       },
       VOLUME_DROP: {
           transform: (vol) => vol * (0.1 + Math.random() * 0.2),
           probability: 0.05
       },
       SUSTAINED_INCREASE: {
           transform: (vol) => vol * 2,
           probability: 0.03,
           duration: 3
       },
       CYCLIC_PATTERN: {
           transform: (vol, date) => {
               const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
               return vol * (1 + Math.sin(dayOfYear * 0.1) * 0.5);
           },
           probability: 0.1
       }
   };
   ```

3. **Configuração e Uso**
   - Instalação: `cd backend && npm install sqlite3`
   - Execução: `node scripts/initDb.js`
   - Gera aproximadamente 225 registros de teste
   - Simula 3 produtos ao longo de 75 dias
   - Inclui metadados como categoria, prioridade e grupo

4. **Parâmetros Configuráveis**
   - Probabilidades de cada tipo de anomalia
   - Intensidade das anomalias
   - Período de dados
   - Produtos e categorias
   - Padrões de sazonalidade

O script é uma ferramenta valiosa para o desenvolvimento contínuo e validação do sistema, permitindo a simulação controlada de diferentes cenários de anomalias e padrões de incidentes. 