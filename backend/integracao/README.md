# SUAT Database Manager - Integração VB.NET

## 📋 Visão Geral

Este projeto fornece uma aplicação de console em VB.NET (.NET Framework 4.7) para gerenciar e sincronizar dados no banco SQLite local do sistema SUAT-IA. É uma ferramenta essencial para a integração completa entre sistemas legados e o novo sistema de IA.

## 🎯 Funcionalidades

### ✅ Principais Recursos

- **🔌 Conexão com SQLite**: Interface de linha de comando para conectar e gerenciar o banco local do SUAT-IA
- **🔄 Sincronização de Dados**: Importação de dados de teste (hardcode) para SQLite
- **📊 Visualização de Dados**: Execução de queries e visualização de resultados
- **📋 Verificação de Tabelas**: Análise da estrutura e conteúdo do banco
- **📝 Logs Detalhados**: Sistema de logs para acompanhar operações

### 🔧 Tipos de Sincronização

1. **Sincronização de Teste**: Importação de dados fixos para validação do sistema
2. **Verificação de Estrutura**: Análise das tabelas e registros existentes

## 🏗️ Estrutura do Projeto

```
backend/integracao/
├── SuatDatabaseManager.vbproj    # Arquivo de projeto VB.NET (.NET Framework 4.7)
├── Program.vb                    # Ponto de entrada da aplicação de console
├── DatabaseManager.vb            # Classe para gerenciar conexões SQLite
├── SincronizadorDados.vb         # Classe de sincronização com dados fixos
├── build.bat                     # Script de build para Windows
├── config.example.json           # Exemplo de configuração
└── README.md                     # Esta documentação
```

## 🚀 Como Usar

### 1. Pré-requisitos

- **Visual Studio 2017/2019/2022** ou **Build Tools**
- **.NET Framework 4.7** ou superior
- **Banco SQLite** do SUAT-IA (geralmente em `../data/database.sqlite`)

### 2. Compilação

```batch
# Na pasta do projeto
build.bat
```

### 3. Execução

```batch
# Executar sem parâmetros (mostra menu de ajuda)
SuatDatabaseManager.exe

# Conectar ao banco SQLite
SuatDatabaseManager.exe connect

# Verificar estrutura do banco
SuatDatabaseManager.exe verify

# Sincronizar dados de teste
SuatDatabaseManager.exe sync

# Executar query SQL
SuatDatabaseManager.exe query "SELECT COUNT(*) FROM incidents"
```

## 📊 Comandos Disponíveis

### `connect`
Conecta ao banco SQLite e exibe informações básicas:
- Total de tabelas
- Tamanho do arquivo
- Status da conexão

### `verify`
Verifica a estrutura do banco de dados:
- Lista todas as tabelas
- Conta registros em cada tabela
- Exibe informações detalhadas

### `sync`
Executa sincronização de teste:
- Limpa dados existentes (opcional)
- Insere dados de teste fixos
- Atualiza tabela de dados históricos

### `query <sql>`
Executa uma query SQL personalizada:
- Exibe resultados formatados
- Mostra primeiras 10 linhas
- Conta total de registros retornados

### `help`
Exibe ajuda e exemplos de uso.

## ⚙️ Configuração

### Dados de Teste

O sistema inclui dados fixos para teste que simulam incidentes reais:

```vb
' Exemplo de dados incluídos:
- INC001: Problema de acesso ao sistema (TI)
- INC002: Impressora não funciona (Administrativo)
- INC003: Erro no relatório mensal (Financeiro)
- INC004: Internet lenta (Vendas)
- INC005: Backup não realizado (TI)
- INC006: Usuário não consegue fazer login (RH)
- INC007: Sistema de email fora do ar (Marketing)
- INC008: Atualização de software necessária (Operações)
```

### Estrutura de Dados

Os dados são inseridos nas tabelas do SUAT-IA:

```sql
-- Tabela incidents
INSERT INTO incidents (
    source_incident_id,      -- ID do incidente
    product_id,              -- Grupo direcionado
    incident_date,           -- Data do incidente (YYYY-MM-DD)
    DATA_CRIACAO,            -- Data de criação (ISO)
    DATA_ENCERRAMENTO,       -- Data de encerramento (ISO)
    CATEGORIA,               -- Categoria do incidente
    GRUPO_DIRECIONADO,       -- Grupo direcionado
    PRIORIDADE,              -- Prioridade
    volume                   -- Sempre 1 para incidentes individuais
)

-- Tabela historical_data (gerada automaticamente)
INSERT INTO historical_data (
    product_id,              -- Grupo direcionado
    group_name,              -- Nome do grupo
    date,                    -- Data
    volume,                  -- Total de incidentes
    category,                -- Categoria mais frequente
    priority,                -- Prioridade mais frequente
    resolution_time,         -- Tempo médio de resolução
    created_at,              -- Data de criação
    updated_at               -- Data de atualização
)
```

## 🛠️ Desenvolvimento

### Dependências NuGet

```xml
<PackageReference Include="System.Data.SQLite.Core" Version="1.0.118" />
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
<PackageReference Include="System.Data.SqlClient" Version="4.8.6" />
```

### Classes Principais

#### Program
- **Responsabilidade**: Ponto de entrada e processamento de argumentos
- **Funcionalidades**: Menu de ajuda, execução de comandos

#### DatabaseManager
- **Responsabilidade**: Gerenciamento de conexões SQLite
- **Funcionalidades**: Conexão, verificação, execução de queries

#### SincronizadorDados
- **Responsabilidade**: Lógica de sincronização com dados fixos
- **Funcionalidades**: Inserção de dados de teste, atualização de dados históricos

### Compatibilidade

- **Framework**: .NET Framework 4.7
- **Sistema**: Windows
- **Tipo**: Aplicação de Console
- **Banco**: SQLite 3.x

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Arquivo SQLite não encontrado
```
❌ Arquivo de banco não encontrado: ..\data\database.sqlite
```
**Solução**: Verificar se o caminho está correto e se o arquivo existe

#### 2. Erro de permissão
```
❌ Erro ao conectar: database is locked
```
**Solução**: Verificar se o backend do SUAT-IA não está rodando

#### 3. Tabelas não encontradas
```
❌ Tabela incidents não encontrada
```
**Solução**: Verificar se o banco SQLite foi inicializado corretamente

#### 4. MSBuild não encontrado
```
❌ MSBuild não encontrado!
```
**Solução**: Instalar Visual Studio ou Build Tools

### Logs de Diagnóstico

O sistema exibe informações detalhadas no console:

```
========================================
    SUAT Database Manager v1.0
    .NET Framework 4.7 - Console App
========================================

🔌 Conectando ao banco SQLite...
✅ Conexão estabelecida com sucesso!
📊 Total de tabelas: 5
📁 Tamanho do arquivo: 26,845,696 bytes
```

## 🔗 Integração com SUAT-IA

### Fluxo de Integração Completa

1. **Verificação**: Usar `verify` para analisar estrutura do banco
2. **Sincronização**: Usar `sync` para inserir dados de teste
3. **Validação**: Usar `query` para verificar dados inseridos
4. **Análise**: O sistema SUAT-IA utiliza os dados para análise preditiva

### Compatibilidade

- **Backend SUAT-IA**: Compatível com a estrutura de banco atual
- **Auto-atualização**: Pode ser integrado ao sistema de atualização automática
- **Distribuição**: Pode ser incluído no pacote de distribuição

## 📈 Próximos Passos

### Melhorias Planejadas

1. **Integração SQL Server**: Conectar com banco real (quando necessário)
2. **Agendamento**: Sincronização automática em horários específicos
3. **Validação**: Verificação de integridade dos dados importados
4. **Backup**: Sistema de backup antes da sincronização
5. **Relatórios**: Geração de relatórios de sincronização

### Integração com Documento Principal

Este projeto implementa as funcionalidades descritas no documento `docs/integracao-vbnet.md`:

- ✅ Classe `SincronizadorDados` com dados de teste
- ✅ Interface de linha de comando para gerenciamento
- ✅ Integração com banco SQLite do SUAT-IA
- ✅ Preparação para integração completa VB.NET + WebView2

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar os logs no console
2. Consultar esta documentação
3. Verificar o documento principal de integração
4. Analisar a estrutura do banco SQLite do SUAT-IA

---

**Desenvolvido para integração com o Sistema SUAT-IA**  
**Versão**: 1.0.0  
**Framework**: .NET Framework 4.7  
**Data**: Janeiro 2025
