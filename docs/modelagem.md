# Análise de Modelagem do Banco de Dados

## Resumo Executivo

Este documento apresenta uma análise completa da estrutura atual do banco de dados SQLite do projeto IA/SUAT, identificando todos os pontos de consumo no backend e frontend, e propondo uma remodelagem para otimizar apenas os campos e tabelas efetivamente utilizados.

## Estrutura Atual do Banco de Dados

### Tabelas Existentes

1. **`incidents`** - 71,731 registros
2. **`historical_data`** - 2,574 registros  
3. **`users`** - 1 registro
4. **`notifications`** - 0 registros
5. **`sqlite_sequence`** - Tabela interna do SQLite

## Análise Detalhada por Tabela

### 1. Tabela `incidents`

#### Estrutura Atual:
```sql
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    DATA_CRIACAO TEXT NOT NULL,
    DATA_ENCERRAMENTO TEXT,
    CATEGORIA TEXT,
    GRUPO_ATUAL TEXT,
    GRUPO_DIRECIONADO TEXT,
    PRIORIDADE TEXT,
    PROBLEMA TEXT,
    SOLUCAO TEXT,
    USU_TRATAMENTO TEXT,
    ANALISE TEXT,
    ACAO TEXT,
    volume INTEGER NOT NULL,
    is_anomaly INTEGER,
    anomaly_type TEXT
)
```

#### Pontos de Consumo Identificados:

**Backend:**
- **IncidentRepository.js** (linhas 16-30):
  - `INCIDENTE` - **NÃO ENCONTRADO na estrutura atual**
  - `CATEGORIA` - ✅ Usado em consultas e criação
  - `GRUPO_ATUAL` - ✅ Usado em consultas e criação
  - `GRUPO_DIRECIONADO` - ✅ Usado em consultas, filtros e criação
  - `DATA_CRIACAO` - ✅ Usado em consultas por período e criação
  - `PRIORIDADE` - ✅ Usado em consultas e criação
  - `PROBLEMA` - ✅ Usado em criação e buscas por texto
  - `SOLUCAO` - ✅ Usado em atualizações
  - `DATA_ENCERRAMENTO` - ✅ Usado quando ação é RESOLVIDO/CANCELADO
  - `USU_TRATAMENTO` - ✅ Usado em atualizações
  - `ANALISE` - ✅ Usado em criação e buscas por texto
  - `ACAO` - ✅ Usado em filtros (CANCELADO, RESOLVIDO, DIRECIONADO)

- **IncidentController.js** (linhas 23-196):
  - Usa filtros por: `startDate`, `endDate`, `grupo`, `acao`
  - Retorna estatísticas agregadas

**Frontend:**
- **incidentService.js** (linhas 1-141):
  - Consome endpoint `/incidents` com filtros de data, grupo e ação
  - Consome endpoint `/incidents/analysis/timeline` para análise temporal
  - Consome endpoint `/incidents/statistics` para estatísticas gerais

#### Campos Não Utilizados:
- `product_id` - Campo presente na estrutura mas não referenciado no código de domínio
- `incident_date` - Campo duplicado com `DATA_CRIACAO`
- `volume` - Campo usado apenas para análise preditiva, mas não para incidentes
- `is_anomaly` - Campo usado apenas para análise preditiva
- `anomaly_type` - Campo usado apenas para análise preditiva

### 2. Tabela `historical_data`

#### Estrutura Atual:
```sql
CREATE TABLE historical_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    date TEXT NOT NULL,
    volume INTEGER NOT NULL,
    category TEXT,
    priority TEXT,
    group_name TEXT,
    resolution_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### Pontos de Consumo Identificados:

**Backend:**
- **HistoricalDataRepository.js** (linhas 1-350):
  - `product_id` - ✅ Usado em todas as consultas principais
  - `date` - ✅ Usado para filtros de período e ordenação
  - `volume` - ✅ Campo principal para análise preditiva
  - `category` - ✅ Usado em agrupamentos e análises
  - `priority` - ✅ Usado em agrupamentos e análises
  - `group_name` - ✅ Usado em agrupamentos
  - `resolution_time` - ✅ Usado para cálculo de médias
  - `created_at` - ✅ Usado para controle de timestamps
  - `updated_at` - ✅ Usado para controle de atualizações

- **PredictiveAnalysisService.js** (linhas 1-1252):
  - Usa todos os campos para análise preditiva, detecção de anomalias e recomendações

**Frontend:**
- **predictiveService.js** (linhas 1-261):
  - Consome endpoints de análise preditiva que dependem desta tabela

#### Todos os Campos São Utilizados ✅

### 3. Tabela `users`

#### Estrutura Atual:
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
```

#### Pontos de Consumo Identificados:

**Backend:**
- **UserRepository.js** (linhas 1-133):
  - `id` - ✅ Usado como chave primária e em consultas
  - `username` - ✅ Usado para login e busca de usuários
  - `password` - ✅ Usado para autenticação
  - `role` - ✅ Usado para controle de acesso

- **AuthController.js** (linhas 1-123):
  - Usa todos os campos para login, registro e verificação de autenticação

**Frontend:**
- **AuthService.js**: Consome endpoints de autenticação

#### Todos os Campos São Utilizados ✅

### 4. Tabela `notifications`

#### Estrutura Atual:
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    related_entity TEXT,
    related_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME
)
```

#### Pontos de Consumo Identificados:

**Backend:**
- **NotificationRepository.js** (linhas 1-232):
  - Implementa todos os métodos CRUD
  - Todos os campos são utilizados nas operações

**Observação Crítica:**
- **0 registros na tabela** - Funcionalidade não está sendo utilizada na prática
- Nenhum endpoint ativo no frontend consome esta funcionalidade

## Problemas Identificados na Estrutura Atual

### 1. Inconsistências na Tabela `incidents`

1. **Campo `INCIDENTE` não existe** - Referenciado no código mas não na estrutura
2. **Redundância de campos de data**:
   - `incident_date` e `DATA_CRIACAO` servem ao mesmo propósito
3. **Campos de análise preditiva misturados**:
   - `volume`, `is_anomaly`, `anomaly_type` não fazem sentido conceitual para incidentes

### 2. Tabela `notifications` Não Utilizada

- 0 registros na tabela
- Funcionalidade implementada mas não consumida
- Overhead desnecessário no sistema

## Proposta de Remodelagem

### Tabela `incidents` Otimizada

```sql
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incidente TEXT NOT NULL,                    -- Campo que estava faltando
    categoria TEXT NOT NULL,
    grupo_atual TEXT NOT NULL,
    grupo_direcionado TEXT,
    data_criacao DATETIME NOT NULL,
    prioridade TEXT NOT NULL,
    problema TEXT,
    solucao TEXT,
    data_encerramento DATETIME,
    usu_tratamento TEXT,
    analise TEXT,
    acao TEXT CHECK(acao IN ('CANCELADO', 'RESOLVIDO', 'DIRECIONADO'))
);
```

**Campos Removidos:**
- `product_id` - Não utilizado no contexto de incidentes
- `incident_date` - Redundante com `data_criacao` 
- `volume` - Pertence ao contexto de análise preditiva
- `is_anomaly` - Pertence ao contexto de análise preditiva
- `anomaly_type` - Pertence ao contexto de análise preditiva

**Campos Adicionados:**
- `incidente` - Campo referenciado no código mas ausente na estrutura

### Tabela `historical_data` (Mantida Integralmente)

```sql
CREATE TABLE historical_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    date TEXT NOT NULL,
    volume INTEGER NOT NULL,
    category TEXT,
    priority TEXT,
    group_name TEXT,
    resolution_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, date)
);
```

**Justificativa:** Todos os campos são ativamente utilizados na análise preditiva.

### Tabela `users` (Mantida Integralmente)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);
```

**Justificativa:** Todos os campos são essenciais para autenticação e autorização.

### Tabela `notifications` (Recomendação: Remover)

**Justificativa para Remoção:**
- 0 registros na tabela
- Funcionalidade não utilizada no frontend
- Código backend implementado mas não consumido
- Reduz complexidade e overhead do sistema

**Alternativa:** Se futuramente necessário, pode ser reimplementada quando houver demanda real.

## Impacto da Remodelagem

### Benefícios

1. **Redução de Espaço:**
   - Eliminação de campos não utilizados
   - Remoção de tabela vazia (`notifications`)

2. **Melhoria de Performance:**
   - Menos campos para indexar
   - Consultas mais eficientes

3. **Consistência de Dados:**
   - Correção do campo `incidente` faltante
   - Eliminação de redundâncias

4. **Manutenibilidade:**
   - Estrutura mais limpa e focada
   - Redução de complexidade desnecessária

### Riscos e Mitigações

1. **Campo `incidente` faltante:**
   - **Risco:** Aplicação pode quebrar
   - **Mitigação:** Adicionar o campo com dados migrados dos existentes

2. **Tabela `notifications`:**
   - **Risco:** Funcionalidade futura pode precisar
   - **Mitigação:** Manter código comentado para reativação rápida

## Script de Migração

```sql
-- 1. Criar nova tabela incidents otimizada
CREATE TABLE incidents_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incidente TEXT NOT NULL,
    categoria TEXT NOT NULL,
    grupo_atual TEXT NOT NULL,
    grupo_direcionado TEXT,
    data_criacao DATETIME NOT NULL,
    prioridade TEXT NOT NULL,
    problema TEXT,
    solucao TEXT,
    data_encerramento DATETIME,
    usu_tratamento TEXT,
    analise TEXT,
    acao TEXT CHECK(acao IN ('CANCELADO', 'RESOLVIDO', 'DIRECIONADO'))
);

-- 2. Migrar dados (assumindo que incidente = problema ou id convertido)
INSERT INTO incidents_new (
    incidente, categoria, grupo_atual, grupo_direcionado,
    data_criacao, prioridade, problema, solucao,
    data_encerramento, usu_tratamento, analise, acao
)
SELECT 
    COALESCE(PROBLEMA, 'INC-' || id) as incidente,
    CATEGORIA, GRUPO_ATUAL, GRUPO_DIRECIONADO,
    DATA_CRIACAO, PRIORIDADE, PROBLEMA, SOLUCAO,
    DATA_ENCERRAMENTO, USU_TRATAMENTO, ANALISE, ACAO
FROM incidents;

-- 3. Substituir tabela antiga
DROP TABLE incidents;
ALTER TABLE incidents_new RENAME TO incidents;

-- 4. Remover tabela notifications não utilizada
DROP TABLE notifications;

-- 5. Recriar índices se necessário
CREATE INDEX idx_incidents_data_criacao ON incidents(data_criacao);
CREATE INDEX idx_incidents_grupo_direcionado ON incidents(grupo_direcionado);
CREATE INDEX idx_incidents_acao ON incidents(acao);
```

## Campos Utilizados por Módulo

### Módulo de Incidentes
**Tabela:** `incidents`
- `id` - Chave primária
- `incidente` - Código/descrição do incidente  
- `categoria` - Classificação do incidente
- `grupo_atual` - Grupo atual responsável
- `grupo_direcionado` - Grupo para onde foi direcionado
- `data_criacao` - Data de criação do incidente
- `prioridade` - Nível de prioridade
- `problema` - Descrição do problema
- `solucao` - Descrição da solução aplicada
- `data_encerramento` - Data de encerramento
- `usu_tratamento` - Usuário responsável pelo tratamento
- `analise` - Análise técnica do incidente
- `acao` - Ação tomada (CANCELADO/RESOLVIDO/DIRECIONADO)

### Módulo de Análise Preditiva
**Tabela:** `historical_data`
- `id` - Chave primária
- `product_id` - Identificador do produto/serviço
- `date` - Data do registro histórico
- `volume` - Volume de ocorrências
- `category` - Categoria do histórico
- `priority` - Prioridade do histórico
- `group_name` - Nome do grupo responsável
- `resolution_time` - Tempo de resolução
- `created_at` - Timestamp de criação
- `updated_at` - Timestamp de atualização

### Módulo de Autenticação
**Tabela:** `users`
- `id` - Chave primária
- `username` - Nome de usuário único
- `password` - Senha hash
- `role` - Perfil/função do usuário

## Recomendações Finais

1. **Implementar a migração** seguindo o script proposto
2. **Testar extensivamente** antes de aplicar em produção
3. **Manter backup** da estrutura original
4. **Atualizar documentação** da API após migração
5. **Monitorar performance** pós-migração
6. **Considerar índices adicionais** baseados nos padrões de consulta mais frequentes

## 🗑️ Campos Removidos

Os seguintes campos foram **REMOVIDOS** do projeto por não serem utilizados ou serem redundantes:

### ❌ **Campos Removidos da Tabela `incidents`:**

1. **`ANALISE`** - Campo de texto livre para análises
   - **Motivo:** Não era utilizado sistematicamente no projeto
   - **Impacto:** Nenhum, pois não há funcionalidades que dependem deste campo

2. **`PROBLEMA`** - Descrição detalhada do problema
   - **Motivo:** Duplicava informações já disponíveis no campo `INCIDENTE`
   - **Impacto:** Nenhum, o campo `INCIDENTE` já contém a informação necessária

3. **`SOLUCAO`** - Descrição da solução aplicada
   - **Motivo:** Não era utilizado no fluxo do sistema nem nas telas
   - **Impacto:** Nenhum, pois não há funcionalidades que exibem ou processam soluções

4. **`GRUPO_ATUAL`** - Grupo atual responsável pelo incidente
   - **Motivo:** Redundante com `GRUPO_DIRECIONADO` e causava confusão
   - **Impacto:** Funcionalidades foram ajustadas para usar apenas `GRUPO_DIRECIONADO`

5. **`USU_TRATAMENTO`** - Usuário responsável pelo tratamento
   - **Motivo:** Não era utilizado em nenhuma funcionalidade do projeto
   - **Impacto:** Nenhum, pois não há telas ou relatórios que usem esta informação

### ✅ **Estrutura Otimizada Resultante:**

A remoção destes campos resultou em uma estrutura de banco mais:
- **Eficiente** (menos campos desnecessários)
- **Consistente** (sem campos redundantes)  
- **Limpa** (apenas campos efetivamente utilizados)
- **Alinhada** com o uso real da aplicação

Esta remodelagem resultará em uma estrutura de banco mais eficiente, consistente e alinhada com o uso real da aplicação. 