# Documentação do Banco de Dados - SUAT IA

## Informações Gerais

- **SGBD**: SQLite 3
- **Arquivo de Banco de Dados**: `database.sqlite` (localizado em `backend/data/`)
- **Driver Utilizado**: Módulo Node.js `sqlite3`

## Tabelas do Banco de Dados

O SUAT IA utiliza duas tabelas principais para armazenar dados:

### 1. Tabela `historical_data`

Armazena informações sobre produtos/sistemas e seus volumes base.

#### Estrutura:

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| id | INTEGER | Identificador único | PRIMARY KEY, AUTOINCREMENT |
| product_id | TEXT | Código do produto | NOT NULL, UNIQUE |
| name | TEXT | Nome do produto/sistema | |
| base_volume | INTEGER | Volume base de referência | |

#### Exemplo de Dados:
```
PRODUTO_A, 'Sistema A', 100
PRODUTO_B, 'Sistema B', 150 
PRODUTO_C, 'Sistema C', 80
ALL, 'Todos os Sistemas', 330
```

### 2. Tabela `incidents`

Armazena os incidentes, tanto consolidados quanto individuais, com suas respectivas informações.

#### Estrutura:

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| id | INTEGER | Identificador único | PRIMARY KEY, AUTOINCREMENT |
| product_id | TEXT | Código do produto relacionado | NOT NULL, FOREIGN KEY |
| incident_date | TEXT | Data do incidente | NOT NULL |
| DATA_CRIACAO | TEXT | Data/hora de criação | NOT NULL |
| DATA_ENCERRAMENTO | TEXT | Data/hora de encerramento | |
| CATEGORIA | TEXT | Categoria do incidente | |
| GRUPO_ATUAL | TEXT | Grupo atual responsável | |
| GRUPO_DIRECIONADO | TEXT | Grupo para qual foi direcionado | |
| PRIORIDADE | TEXT | Prioridade do incidente | |
| PROBLEMA | TEXT | Descrição do problema | |
| SOLUCAO | TEXT | Descrição da solução | |
| USU_TRATAMENTO | TEXT | Usuário que tratou o incidente | |
| ANALISE | TEXT | Análise realizada | |
| ACAO | TEXT | Ação tomada (RESOLVIDO, DIRECIONADO, CANCELADO) | |
| volume | INTEGER | Volume (quantidade) de incidentes | NOT NULL |
| is_anomaly | INTEGER | Indica se é uma anomalia (0=não, 1=sim) | DEFAULT 0 |
| anomaly_type | TEXT | Tipo da anomalia (quando aplicável) | |

## Relacionamentos

- A tabela `incidents` possui uma chave estrangeira (`product_id`) que referencia a coluna `product_id` na tabela `historical_data`
- Cada produto/sistema na tabela `historical_data` pode ter múltiplos incidentes na tabela `incidents`

## Uso no Backend

O banco de dados é acessado através dos seguintes repositórios:

1. **IncidentRepository** (`backend/src/infrastructure/database/IncidentRepository.js`)
   - Responsável por operações relacionadas a incidentes
   - Implementa métodos para busca, filtragem e análise de incidentes

2. **HistoricalDataRepository** (`backend/src/infrastructure/database/HistoricalDataRepository.js`)
   - Gerencia os dados históricos e volumes por produto
   - Fornece métodos para análise histórica e previsões


## Considerações sobre os Dados

1. **Categoria "CONSOLIDADO"**
   - Registros com CATEGORIA="CONSOLIDADO" representam dados agregados por dia e produto
   - Estes registros contêm volume total consolidado para aquele dia específico

2. **Produto "ALL"**
   - Registros com product_id="ALL" representam dados agregados de todos os produtos
   - São calculados automaticamente a partir dos dados dos produtos individuais

3. **Anomalias**
   - Registros com is_anomaly=1 representam detecções de anomalias
   - Os tipos de anomalia incluem:
     - VOLUME_SPIKE: Picos anormais de volume (3-5x acima do normal)
     - VOLUME_DROP: Quedas abruptas (10-30% do volume normal)
     - SUSTAINED_INCREASE: Aumentos sustentados por vários dias (2x o volume normal)

## Localização do Arquivo

O arquivo principal de banco de dados está localizado em `backend/data/database.sqlite` e contém aproximadamente 4500 registros (incluindo dados históricos e projeções). O tamanho do arquivo é de aproximadamente 92KB. Existem também outros arquivos relacionados no mesmo diretório, como `database.sqlite.bak` (backup) e `incidents.db`.

## Considerações para Manutenção

1. O banco está configurado com vários padrões sazonais para simular cenários reais:
   - Variação semanal (menos incidentes nos fins de semana)
   - Variação mensal (mais incidentes no final do mês)
   - Variação anual (menos incidentes em janeiro/dezembro, mais em março/abril/setembro/outubro)

2. Para limpar e recriar o banco de dados, execute um dos scripts de população:

## Novo fluxo de carga de dados (2024)

Para garantir dados realistas e consistentes, siga este fluxo:

1. **Popule a tabela `incidents`** usando o script de seed:
   ```
   node backend/src/database/scripts/seedData.js
   ```
   - Isso irá gerar milhares de incidentes individuais para cada produto, desde 01-01-2023 até hoje, incluindo anomalias.
   - O script mantém a lógica de carga complementar (não sobrescreve dados existentes).

2. **Consolide os dados em `historical_data`** usando o script de consolidação:
   ```
   node backend/src/database/scripts/consolidateHistoricalData.js
   ```
   - Esse script lê todos os incidentes e agrega o volume diário por produto, preenchendo a tabela `historical_data`.
   - Também mantém a lógica de carga complementar.

### Por que dois scripts?
- `incidents` armazena cada incidente individual, usado para análises detalhadas, timelines, detecção de anomalias e relatórios.
- `historical_data` armazena o volume diário agregado por produto, usado para análises preditivas, gráficos históricos e cálculos de tendência/sazonalidade.
- Separar a carga permite simular o uso real do sistema e garantir que os dados agregados reflitam exatamente os incidentes individuais.

### Observação
- Não gere registros para o produto `ALL` nem para categoria "CONSOLIDADO" nos scripts de seed.
- Para simular anomalias, cerca de 5% dos incidentes terão `is_anomaly=1` e um `anomaly_type` válido.

## Geração de Dados de Anomalia para Testes

O script `seedData.js` foi projetado para gerar dados de incidentes realistas e garantir que todos os tipos de anomalias definidos no sistema sejam representados no banco. Isso é fundamental para testar e validar o sistema de detecção de anomalias.

### Como os cenários de anomalia são simulados
- **Período:** Os dados são gerados de 01-01-2020 até a data atual.
- **Volume diário:** Cada dia recebe entre 50 e 300 incidentes, com dias de pico podendo chegar a 400.
- **Datas de alto volume:**
  - 5º dia útil de cada mês
  - Datas atípicas como Natal, Ano Novo, Dia das Mães, Dia das Crianças, feriados nacionais
  - Nesses dias, o volume é elevado e marcado como anomalia do tipo `VOLUME_SPIKE`.
- **Outros tipos de anomalia:**
  - **VOLUME_DROP:** Dias específicos do mês têm volume forçado para baixo (50 a 80 incidentes).
  - **SUSTAINED_INCREASE:** Períodos de vários dias seguidos com volume alto (200 a 300 incidentes).
  - **SUSTAINED_DECREASE:** Períodos de vários dias seguidos com volume baixo (50 a 100 incidentes).
  - **CYCLIC_PATTERN:** Segundas-feiras têm volume alto, outros dias baixos, simulando padrão cíclico semanal. Em alguns dias, o padrão é quebrado para marcar anomalia cíclica.
- **Marcação de anomalias:**
  - Incidentes em dias/intervalos anômalos recebem `is_anomaly=1` e o campo `anomaly_type` correspondente.

### Benefícios
- Permite testar todos os algoritmos de detecção de anomalias do sistema.
- Garante que o backend e o frontend possam exibir e analisar todos os tipos de anomalia previstos.
- Facilita a validação de dashboards, relatórios e recomendações baseadas em anomalias.
