# 🚀 GUIA RÁPIDO DE MIGRAÇÃO

## Como Executar a Migração Completa

### 📋 Pré-requisitos
- ✅ Aplicação rodando (backend + frontend)
- ✅ Banco de dados com dados de teste
- ✅ Node.js instalado
- ✅ Permissões de escrita na pasta do projeto

### 🎯 Execução Passo a Passo

#### 1. Preparar o Ambiente
```bash
# Navegar para a pasta de scripts
cd migration-scripts

# Instalar dependências se necessário
npm install sqlite3
```

#### 2. Executar Fase 1 - Análise
```bash
# Executar análise completa
node phase1-preparation.js
```
**⏱️ Tempo: ~10 minutos**

**O que faz:**
- 📦 Cria backup automático do banco
- 📊 Analisa grupos existentes
- 🔍 Mapeia dependências do código
- ✅ Valida integridade dos dados

**Resultados:**
- `migration-analysis.json` - Relatório completo
- `migration-data.sql` - Script de migração SQL
- `database.sqlite.backup.YYYY-MM-DD` - Backup do banco

#### 3. Executar Migração Completa
```bash
# Opção 1: Executar todas as fases
node execute-migration.js all

# Opção 2: Executar fase específica
node execute-migration.js phase 1
node execute-migration.js phase 2
# ... e assim por diante
```

#### 4. Rollback (se necessário)
```bash
# Se algo der errado, executar rollback
node rollback-plan.js interactive
```

### 📊 Monitoramento

#### Verificar Status
```bash
# Ver status geral
node execute-migration.js status

# Listar backups disponíveis
node rollback-plan.js list
```

#### Arquivos Gerados
- `migration-analysis.json` - Análise inicial
- `migration-final-report.json` - Relatório final
- `rollback-report-YYYY-MM-DD.json` - Relatório de rollback (se usado)

### ⚠️ Pontos de Atenção

#### Antes de Começar
1. **Parar serviços em produção** (se aplicável)
2. **Confirmar backup** foi criado
3. **Testar rollback** em ambiente de desenvolvimento

#### Durante a Execução
1. **Não interromper** o processo das fases automatizadas
2. **Validar cada fase** antes de prosseguir
3. **Documentar problemas** encontrados

#### Após Conclusão
1. **Testar todas as funcionalidades**
2. **Verificar performance**
3. **Monitorar logs** por alguns dias

### 🆘 Troubleshooting

#### Problema: Script não encontra banco de dados
```bash
# Verificar se o caminho está correto
ls -la backend/data/database.sqlite
```

#### Problema: Erro de permissão
```bash
# Dar permissões necessárias
chmod +x migration-scripts/*.js
```

#### Problema: Migração falhou
```bash
# Executar rollback imediatamente
node rollback-plan.js interactive
```

### 📞 Suporte

Se encontrar problemas:
1. ✅ Verificar logs no console
2. ✅ Consultar arquivos de relatório
3. ✅ Executar rollback se necessário
4. ✅ Revisar MIGRATION_PLAN.md para detalhes

---

## 🎯 COMANDOS RESUMIDOS

```bash
# Preparação
cd migration-scripts
node phase1-preparation.js

# Migração completa
node execute-migration.js all

# Rollback (se necessário)
node rollback-plan.js interactive

# Status
node execute-migration.js status
```

---

*⏰ Duração total estimada: 8-12 dias úteis*  
*🔧 Principalmente trabalho manual nas fases 2 e 3* 