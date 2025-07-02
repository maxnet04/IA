# 🎯 PLANO DE MIGRAÇÃO COMPLETA: PRODUTO → GRUPO DIRECIONADO

## 📋 OVERVIEW
**Objetivo**: Substituir completamente o sistema de filtros por `product_id` para `GRUPO_DIRECIONADO`
**Prazo Estimado**: 8-12 dias úteis
**Estratégia**: Migração progressiva com rollback disponível

---

## 🔄 ESTRATÉGIA DE EXECUÇÃO

### Princípios da Migração:
1. **Backup completo** antes de cada fase
2. **Validação** após cada etapa
3. **Rollback disponível** em caso de problemas
4. **Mínima interrupção** do serviço
5. **Testes automatizados** para cada componente

---

## 📅 CRONOGRAMA DE EXECUÇÃO

### **FASE 1: PREPARAÇÃO E ANÁLISE (Dias 1-2)**
#### Dia 1 - Preparação do Ambiente
- [ ] ✅ Backup completo do banco de dados
- [ ] 📊 Análise dos grupos existentes
- [ ] 🔍 Mapeamento de dependências
- [ ] 📝 Criação de scripts de rollback

#### Dia 2 - Preparação da Base de Dados
- [ ] 🗃️ Criação de tabelas temporárias
- [ ] 📈 Análise de dados históricos por grupo
- [ ] 🔧 Scripts de migração de dados
- [ ] ✅ Validação da integridade dos dados

---

### **FASE 2: BACKEND - INFRAESTRUTURA (Dias 3-5)**
#### Dia 3 - Repositórios e Banco
- [ ] 🔧 Modificar `HistoricalDataRepository.js`
- [ ] 🆕 Criar `GroupRepository.js`
- [ ] 📊 Atualizar queries de agregação
- [ ] ✅ Testes unitários dos repositórios

#### Dia 4 - Services Layer
- [ ] 🔧 Modificar `PredictiveAnalysisService.js`
- [ ] 🔧 Atualizar `RecommendationService.js`
- [ ] 🔧 Adaptar `InfluenceFactorsService.js`
- [ ] ✅ Testes de integração dos services

#### Dia 5 - Controllers e Rotas
- [ ] 🔧 Atualizar `PredictiveAnalysisController.js`
- [ ] 🔧 Modificar `PredictiveController.js`
- [ ] 🆕 Criar rotas para grupos
- [ ] 📝 Atualizar documentação Swagger

---

### **FASE 3: FRONTEND - COMPONENTES (Dias 6-8)**
#### Dia 6 - Components Base
- [ ] 🆕 Criar `GroupSelector` component
- [ ] 🔧 Atualizar `PredictiveAnalysis/index.js`
- [ ] 🔧 Modificar `RecommendationsPage/index.js`
- [ ] ✅ Testes de componentes

#### Dia 7 - Hooks e Services
- [ ] 🔧 Atualizar `usePredictiveAnalysis.js`
- [ ] 🔧 Modificar `useRecommendations.js`
- [ ] 🔧 Adaptar `useAnomalies.js`
- [ ] 🔧 Atualizar `predictiveService.js`

#### Dia 8 - Pages e Layout
- [ ] 🔧 Atualizar `AnomaliesPage/index.js`
- [ ] 🔧 Modificar `TimelineAnalysisPage/index.js`
- [ ] 🔧 Adaptar `Dashboard/index.js`
- [ ] ✅ Testes end-to-end

---

### **FASE 4: MIGRAÇÃO DE DADOS (Dia 9)**
- [ ] 🗃️ Executar scripts de migração
- [ ] 📊 Consolidar dados históricos por grupo
- [ ] 🔍 Validar integridade dos dados migrados
- [ ] 🧪 Testes de performance

---

### **FASE 5: TESTES E VALIDAÇÃO (Dias 10-11)**
#### Dia 10 - Testes Funcionais
- [ ] 🧪 Testes de regressão completos
- [ ] 📊 Validação de dashboards
- [ ] 🔍 Verificação de anomalias
- [ ] 📈 Teste de recomendações

#### Dia 11 - Testes de Performance
- [ ] ⚡ Benchmark de consultas
- [ ] 📊 Análise de memória
- [ ] 🔄 Teste de carga
- [ ] 🐛 Correção de bugs identificados

---

### **FASE 6: DEPLOY E MONITORAMENTO (Dia 12)**
- [ ] 🚀 Deploy em ambiente de produção
- [ ] 📊 Monitoramento de métricas
- [ ] 🔍 Validação pós-deploy
- [ ] 📝 Documentação final

---

## 🛠️ SCRIPTS E COMANDOS

### Backup e Preparação
```bash
# Backup do banco
cp backend/data/database.sqlite backend/data/database.sqlite.backup.$(date +%Y%m%d)

# Análise de grupos existentes
sqlite3 backend/data/database.sqlite "SELECT DISTINCT GRUPO_DIRECIONADO, COUNT(*) FROM incidents GROUP BY GRUPO_DIRECIONADO;"
```

### Rollback (caso necessário)
```bash
# Restaurar banco
cp backend/data/database.sqlite.backup.YYYYMMDD backend/data/database.sqlite

# Reverter código (se usando git)
git checkout HEAD~1
```

---

## 🔍 PONTOS DE VALIDAÇÃO

### Validação Fase 1
- [ ] Backup criado com sucesso
- [ ] Lista de grupos mapeada
- [ ] Scripts de rollback testados

### Validação Fase 2
- [ ] Endpoints respondem corretamente
- [ ] Queries retornam dados esperados
- [ ] Testes unitários passando

### Validação Fase 3
- [ ] Interface carrega sem erros
- [ ] Seleção de grupos funcional
- [ ] Gráficos são renderizados

### Validação Fase 4
- [ ] Dados migrados com integridade
- [ ] Performance mantida
- [ ] Dados históricos preservados

### Validação Final
- [ ] Todas as funcionalidades operacionais
- [ ] Performance aceitável
- [ ] Sem erros críticos
- [ ] Usuários conseguem usar o sistema

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco: Perda de dados históricos
**Mitigação**: Backup completo + scripts de rollback testados

### Risco: Performance degradada
**Mitigação**: Benchmarks antes/depois + otimização de queries

### Risco: Interface confusa para usuários
**Mitigação**: Documentação + treinamento + feedback contínuo

### Risco: Quebra de funcionalidades
**Mitigação**: Testes automatizados + validação manual completa

---

## 🚨 PLANO DE CONTINGÊNCIA

### Cenário 1: Problemas graves no backend
1. Parar serviços
2. Restaurar banco do backup
3. Reverter código para versão anterior
4. Reiniciar serviços
5. Investigar causa raiz

### Cenário 2: Interface não funcional
1. Reverter frontend para versão anterior
2. Manter backend funcionando
3. Corrigir problemas de interface
4. Re-deploy após correção

### Cenário 3: Performance inaceitável
1. Identificar queries problemáticas
2. Otimizar índices do banco
3. Implementar cache se necessário
4. Monitorar métricas continuamente

---

## 📊 MÉTRICAS DE SUCESSO

### Métricas Técnicas
- [ ] Tempo de resposta < 2s para consultas
- [ ] 0 erros críticos em produção
- [ ] 100% dos testes automatizados passando
- [ ] Uso de memória < baseline + 20%

### Métricas de Negócio
- [ ] Usuários conseguem acessar dashboards
- [ ] Recomendações são geradas corretamente
- [ ] Anomalias são detectadas
- [ ] Relatórios são precisos

---

## 📝 CHECKLIST DE EXECUÇÃO

### Antes de Começar
- [ ] Ambiente de desenvolvimento configurado
- [ ] Backup do banco criado
- [ ] Scripts de rollback preparados
- [ ] Equipe alinhada sobre o plano

### Durante a Execução
- [ ] Validar cada fase antes de prosseguir
- [ ] Documentar problemas encontrados
- [ ] Comunicar progresso regularmente
- [ ] Manter logs detalhados

### Após Conclusão
- [ ] Validação completa do sistema
- [ ] Documentação atualizada
- [ ] Treinamento da equipe
- [ ] Monitoramento pós-deploy

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar e aprovar este plano**
2. **Preparar ambiente de desenvolvimento**
3. **Executar Fase 1 - Preparação**
4. **Validar resultados da Fase 1**
5. **Prosseguir com Fase 2**

---

*Este plano deve ser revisado e aprovado pela equipe antes da execução. Qualquer desvio deve ser documentado e comunicado.* 