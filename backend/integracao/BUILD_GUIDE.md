# 🚀 Guia de Build Automatizado - SUAT Database Manager

## 📋 Visão Geral

Este guia documenta o processo de build automatizado que inclui compilação, distribuição e testes automáticos do sistema SUAT Database Manager.

## 🔧 Arquivo de Build

### `build.bat`
Script principal que automatiza todo o processo de build e testes.

## 🎯 Funcionalidades do Build

### ✅ Compilação Inteligente
- **dotnet build**: Tenta primeiro com dotnet build (mais moderno)
- **MSBuild fallback**: Se dotnet falhar, usa MSBuild como alternativa
- **Configuração Release**: Compila sempre em modo Release para produção

### 📦 Distribuição Automática
- **Pasta dist**: Cria pasta de distribuição limpa
- **Executável**: Copia o executável principal
- **DLLs**: Copia todas as dependências necessárias
- **DLLs Nativas**: Copia SQLite.Interop.dll para x64 e x86
- **Configuração**: Copia arquivos de configuração

### 🧪 Testes Automáticos
- **Teste de Conexão**: Verifica se consegue conectar ao banco
- **Teste de Estrutura**: Verifica tabelas e registros
- **Teste de Query**: Executa query de teste
- **Teste de Sincronização**: Testa sincronização de dados
- **Logs Detalhados**: Salva logs de cada teste

## 🚀 Como Usar

### Execução Simples
```batch
# Na pasta integracao
.\build.bat
```

### Saída Esperada
```
========================================
   SUAT Database Manager - Build
   .NET Framework 4.7 - Console App
========================================

🔄 Tentando compilação com dotnet build...
✅ Compilação com dotnet build concluída com sucesso!
🔄 Preparando distribuição...
✅ DLLs x64 copiadas
✅ DLLs x86 copiadas
✅ Executável copiado de bin\Release\net47\

✅ Build concluído com sucesso!
📁 Executável gerado em: dist\SuatDatabaseManager.exe

========================================
   EXECUTANDO TESTES AUTOMÁTICOS
========================================

🔌 Teste 1: Verificando conexão com banco...
✅ Teste de conexão PASSOU
📊 Teste 2: Verificando estrutura do banco...
✅ Teste de verificação PASSOU
🔍 Teste 3: Executando query de teste...
✅ Teste de query PASSOU
🔄 Teste 4: Testando sincronização (opcional)...
✅ Teste de sincronização PASSOU
```

## 📁 Estrutura de Saída

Após o build bem-sucedido, você terá:

```
dist/
├── SuatDatabaseManager.exe          # Executável principal
├── SuatDatabaseManager.exe.config   # Configuração
├── System.Data.SQLite.dll          # DLL do SQLite
├── System.Data.SqlClient.dll       # DLL do SQL Server
├── Newtonsoft.Json.dll             # DLL do JSON
├── x64/
│   └── SQLite.Interop.dll          # DLL nativa x64
└── x86/
    └── SQLite.Interop.dll          # DLL nativa x86
```

## 📋 Logs de Teste

O build gera logs detalhados para cada teste:

- **test_connect.log**: Resultado do teste de conexão
- **test_verify.log**: Resultado da verificação de estrutura
- **test_query.log**: Resultado da query de teste
- **test_sync.log**: Resultado da sincronização

### Exemplo de Log de Sucesso
```
🔌 Conectando ao banco SQLite...
✅ Conexão estabelecida com sucesso!
📊 Total de tabelas: 5
📁 Tamanho do arquivo: 26.755.072 bytes
```

## ⚠️ Solução de Problemas

### Erro: "Não é possível carregar a DLL 'SQLite.Interop.dll'"
**Causa**: DLLs nativas não foram copiadas
**Solução**: Verificar se as pastas x64 e x86 existem em dist/

### Erro: "MSBuild não encontrado"
**Causa**: Visual Studio Build Tools não instalado
**Solução**: O script tentará usar dotnet build automaticamente

### Erro: "Banco de dados SQLite não encontrado"
**Causa**: Caminho do banco incorreto
**Solução**: Verificar se ../data/database.sqlite existe

## 🔄 Fluxo de Build

1. **Detecção de Ferramentas**: Verifica dotnet build ou MSBuild
2. **Compilação**: Compila o projeto em modo Release
3. **Distribuição**: Copia arquivos para pasta dist/
4. **Testes**: Executa 4 testes automáticos
5. **Relatório**: Exibe resumo dos resultados

## 📊 Métricas de Sucesso

- ✅ **Compilação**: Projeto compila sem erros
- ✅ **Distribuição**: Todos os arquivos copiados
- ✅ **Conexão**: Conecta ao banco SQLite
- ✅ **Estrutura**: 5 tabelas encontradas
- ✅ **Query**: Executa consultas SQL
- ✅ **Sincronização**: Sincroniza dados de teste

## 🎯 Próximos Passos

Após o build bem-sucedido:

1. **Teste Manual**: Execute `dist\SuatDatabaseManager.exe`
2. **Deploy**: Copie a pasta dist/ para o servidor
3. **Configuração**: Ajuste config.json se necessário
4. **Monitoramento**: Use os logs para acompanhar execuções

---

**Última atualização**: Configuração de caminho relativo e build automatizado completo
