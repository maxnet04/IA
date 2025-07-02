
-- SCRIPT DE MIGRAÇÃO: PRODUTO → GRUPO DIRECIONADO
-- Gerado automaticamente em: 2025-06-25T01:06:09.320Z

-- 1. Criar tabela temporária para mapeamento
CREATE TABLE IF NOT EXISTS temp_group_mapping (
    old_product_id TEXT,
    new_group_id TEXT,
    group_name TEXT,
    migration_date TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Popular mapeamento baseado nos dados existentes
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'SEGURANCA', 'SEGURANCA');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'SUPORTE_N2', 'SUPORTE_N2');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'DADOS', 'DADOS');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'DEV', 'DEV');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'INFRAESTRUTURA', 'INFRAESTRUTURA');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'DESENVOLVIMENTO', 'DESENVOLVIMENTO');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'SUPORTE', 'SUPORTE');
INSERT OR IGNORE INTO temp_group_mapping (old_product_id, new_group_id, group_name) VALUES ('LEGACY', 'SUPORTE_N1', 'SUPORTE_N1');

-- 3. Criar nova estrutura de dados históricos por grupo
CREATE TABLE IF NOT EXISTS historical_data_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    date TEXT NOT NULL,
    volume INTEGER NOT NULL,
    category TEXT,
    priority TEXT,
    resolution_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, date)
);

-- 4. Migrar dados históricos
INSERT OR IGNORE INTO historical_data_groups (group_id, date, volume, category, priority, resolution_time)
SELECT 
    incidents.GRUPO_DIRECIONADO as group_id,
    DATE(incidents.DATA_CRIACAO) as date,
    COUNT(*) as volume,
    GROUP_CONCAT(DISTINCT incidents.CATEGORIA) as category,
    GROUP_CONCAT(DISTINCT incidents.PRIORIDADE) as priority,
    AVG(
        CASE 
            WHEN incidents.DATA_ENCERRAMENTO IS NOT NULL 
            THEN (julianday(incidents.DATA_ENCERRAMENTO) - julianday(incidents.DATA_CRIACAO)) * 24 * 60 
        END
    ) as resolution_time
FROM incidents 
WHERE incidents.GRUPO_DIRECIONADO IS NOT NULL
GROUP BY incidents.GRUPO_DIRECIONADO, DATE(incidents.DATA_CRIACAO)
ORDER BY incidents.GRUPO_DIRECIONADO, DATE(incidents.DATA_CRIACAO);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_historical_groups_group_date ON historical_data_groups(group_id, date);
CREATE INDEX IF NOT EXISTS idx_historical_groups_date ON historical_data_groups(date);

-- 6. Validar migração
SELECT 
    'Grupos migrados' as metric,
    COUNT(DISTINCT group_id) as value
FROM historical_data_groups
UNION ALL
SELECT 
    'Registros de dados históricos' as metric,
    COUNT(*) as value
FROM historical_data_groups;
        