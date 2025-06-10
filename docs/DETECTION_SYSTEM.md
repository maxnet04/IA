# Sistema de Detecção de Anomalias - SUAT IA

## Visão Geral

O sistema de detecção de anomalias do SUAT IA é responsável por identificar padrões anômalos no volume de incidentes. 
As anomalias são detectadas através de uma combinação de técnicas estatísticas e análise de padrões temporais.

## Tipos de Anomalias

O sistema é capaz de detectar cinco tipos principais de anomalias:

### 1. VOLUME_SPIKE (Picos de Volume)

- **Descrição**: Aumentos súbitos e significativos no volume de incidentes.
- **Parâmetros Atuais**:
  - Threshold: 1.5 desvios padrão acima da média da janela deslizante de 7 dias
  - Severidade: ALTA
  - Prioridade de Detecção: 1 (máxima)
- **Justificativa do Ajuste**: O threshold foi reduzido de 2.0 para 1.5 desvios padrão, permitindo a detecção de picos menos severos, mas ainda significativos do ponto de vista estatístico. Este ajuste aumentou a sensibilidade sem comprometer a precisão.

### 2. VOLUME_DROP (Quedas de Volume)

- **Descrição**: Reduções abruptas no volume de incidentes.
- **Parâmetros Atuais**:
  - Threshold: 1.5 desvios padrão abaixo da média da janela deslizante de 7 dias
  - Severidade: MÉDIA
  - Prioridade de Detecção: 2
- **Justificativa do Ajuste**: Similarmente ao VOLUME_SPIKE, o threshold foi reduzido de 2.0 para 1.5 desvios padrão para aumentar a sensibilidade da detecção.

### 3. SUSTAINED_INCREASE (Aumento Sustentado)

- **Descrição**: Aumento persistente no volume de incidentes por múltiplos dias.
- **Parâmetros Atuais**:
  - Threshold1: 170% da média da janela para a média dos últimos 3 dias
  - Threshold2: 130% da média da janela para o volume atual
  - Severidade: ALTA
  - Prioridade de Detecção: 3
- **Justificativa do Ajuste**: Os thresholds foram reduzidos de 200%/150% para 170%/130%, permitindo capturar aumentos sustentados menos extremos, mas ainda significativos para o negócio.

### 4. SUSTAINED_DECREASE (Diminuição Sustentada)

- **Descrição**: Redução persistente no volume de incidentes por múltiplos dias.
- **Parâmetros Atuais**:
  - Threshold1: 60% da média da janela para a média dos últimos 3 dias (40% abaixo)
  - Threshold2: 70% da média da janela para o volume atual (30% abaixo)
  - Severidade: MÉDIA
  - Prioridade de Detecção: 4
- **Justificativa dos Parâmetros**: Os thresholds foram estabelecidos para balancear entre sensibilidade e precisão, identificando quedas sustentadas significativas, mas não excessivamente sensíveis a flutuações normais.

### 5. CYCLIC_PATTERN (Padrão Cíclico Anômalo)

- **Descrição**: Variações anormais em padrões cíclicos esperados (ex: dia da semana).
- **Parâmetros Atuais**:
  - Threshold: 80% de desvio do padrão esperado para o dia da semana
  - Severidade: MÉDIA
  - Prioridade de Detecção: 5 (menor)
- **Justificativa do Ajuste**: O threshold foi aumentado de 50% para 80%, reduzindo falsos positivos e detectando apenas desvios realmente significativos do padrão cíclico semanal.

## Sistema de Priorização

O sistema implementa um mecanismo de priorização para tratar casos em que múltiplos tipos de anomalias são detectados para a mesma data. Isto evita duplicidade de alertas e foca na anomalia mais relevante.

### Lógica de Priorização

Quando várias anomalias são detectadas para a mesma data, o sistema:

1. Atribui uma prioridade numérica a cada tipo de anomalia (número menor = maior prioridade)
2. Ordena as anomalias detectadas por prioridade
3. Seleciona apenas a anomalia de maior prioridade para reportar

### Ordem de Prioridade Atual

1. **VOLUME_SPIKE (1)**: Prioridade máxima devido à sua natureza crítica e impacto imediato
2. **VOLUME_DROP (2)**: Alta prioridade, pois pode indicar problemas graves ou falhas na coleta de dados
3. **SUSTAINED_INCREASE (3)**: Prioridade média-alta, indicando problemas emergentes que requerem atenção
4. **SUSTAINED_DECREASE (4)**: Prioridade média, potencialmente indicando melhorias ou problemas de reporting
5. **CYCLIC_PATTERN (5)**: Prioridade mais baixa, geralmente representando desvios menos urgentes dos padrões esperados

## Processo de Detecção

O algoritmo utiliza uma janela deslizante de 7 dias para analisar os dados históricos e calcula:

1. Média e desvio padrão dentro da janela
2. Padrões cíclicos por dia da semana
3. Tendências de crescimento/redução

Para cada ponto de dados, todas as cinco verificações de anomalias são executadas. Se múltiplas anomalias forem detectadas, o sistema de priorização seleciona a mais relevante conforme a hierarquia definida.

## Configurações e Ajustes

Os thresholds e parâmetros do sistema podem ser ajustados para adaptar a sensibilidade da detecção conforme necessário. Os valores atuais foram calibrados com base em testes extensivos para balancear:

- Sensibilidade (minimizar falsos negativos)
- Precisão (minimizar falsos positivos)
- Relevância para o negócio

## Recomendações para Futuros Ajustes

- Considerar ajustes sazonais adicionais (mensal, trimestral)
- Implementar detecção de anomalias contextuais baseadas em outras variáveis além do volume
- Desenvolver mecanismos de auto-calibração baseados em feedback dos usuários 