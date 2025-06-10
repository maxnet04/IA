# Scripts de Banco de Dados

Este diretório contém scripts e utilidades relacionados ao banco de dados SQLite usado pela aplicação.

## Estrutura

- `database/`
  - `DatabaseManager.js` - Gerenciador singleton do banco de dados
  - `DatabaseInitializer.js` - Inicializador dos repositórios e tabelas
  - `index.js` - Exporta os módulos do banco de dados
  - `scripts/` - Scripts utilitários para o banco de dados
    - `initDb.js` - Inicializa o banco e cria as tabelas
    - `seedData.js` - Popula o banco com dados de teste

## IMPORTANTE: Banco de Dados

**O banco de dados da aplicação DEVE ser um arquivo único e exclusivo:**
- Localização: `/backend/data/database.sqlite`
- Este é o ÚNICO arquivo de banco de dados permitido
- NÃO DEVE existir nenhum outro arquivo de banco de dados na aplicação

## IMPORTANTE: Scripts de Manutenção do Banco

**A pasta `/backend/src/database/scripts` contém APENAS dois arquivos que devem ser utilizados para manutenção do banco:**

1. **`initDb.js`**: 
   - Responsável exclusivamente pela criação das tabelas no banco de dados
   - Qualquer nova tabela ou alteração de estrutura DEVE ser implementada neste arquivo

2. **`seedData.js`**: 
   - Responsável exclusivamente por popular o banco com dados fictícios para testes
   - Qualquer necessidade de dados de teste DEVE ser implementada neste arquivo

**NENHUM outro arquivo de manutenção do banco deve existir!** 
Qualquer necessidade de ajuste no banco de dados DEVE ser implementada exclusivamente nestes dois arquivos.

## Scripts Disponíveis

A aplicação fornece scripts para inicializar e popular o banco de dados com dados de teste:

### Inicialização do Banco

O script `init-db.js` cria todas as tabelas necessárias no banco de dados:

```bash
npm run init:db
```

**IMPORTANTE**: Este script NÃO executa automaticamente no início da aplicação.

### População de Dados

O script `seed-db.js` popula o banco de dados com dados de teste:

```bash
npm run seed:db
```

Este script:
- Insere dados a partir de 01/01/2025 até a data atual
- Verifica a última data já existente no banco para cada produto
- Se já existirem dados, apenas complementa com novos registros até a data atual
- Não duplica dados existentes (usa INSERT OR REPLACE)
- Cria um usuário administrador padrão para acesso ao sistema

### Configuração Completa

Para inicializar e popular o banco de dados em uma única operação:

```bash
npm run setup:db
```

## Quando Usar os Scripts

- **Desenvolvimento inicial**: Use `npm run setup:db` para configurar o ambiente rapidamente
- **Após redefinir o banco**: Use `npm run setup:db` para recriar todo o ambiente
- **Adicionar novos dados de teste**: Use `npm run seed:db` para adicionar apenas novos dados
- **Atualizar esquema do banco**: Use `npm run init:db` para criar novas tabelas após alterações

**NUNCA execute estes scripts em ambiente de produção!** Eles são apenas para desenvolvimento e testes.

## Implementação

Os scripts respeitam o padrão de dados da aplicação e não interferem nas operações normais. 
Todos os dados gerados seguem o mesmo formato que a aplicação espera receber. 