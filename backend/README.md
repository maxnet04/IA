# SUAT-IA-Backend

Backend do Sistema Unificado de Análise e Tratamento de Incidentes com Inteligência Artificial.

## Requisitos

- Node.js 14+ 
- npm 6+

## Instalação

```bash
# Instalar dependências
npm install

# Inicializar o banco de dados
npm run init:db

# Popular o banco de dados com dados de teste (opcional)
npm run seed:db

# Ou para fazer ambos em um só comando
npm run setup:db
```

## Inicialização Rápida

Para iniciar o backend rapidamente, siga estes passos:

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/suat-ia-backend.git
cd suat-ia-backend

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados (inicializa e popula com dados de teste)
npm run setup:db

# 4. Inicie o servidor em modo de desenvolvimento
npm run dev       # Para Linux/Mac
npm run dev:win   # Para Windows
```

## Execução

O backend pode ser executado em diferentes modos, conforme suas necessidades:

```bash
# Modo de desenvolvimento (com hot-reload)
npm run dev       # Para Linux/Mac
npm run dev:win   # Para Windows

# Modo de produção (otimizado)
npm start

# Verificar a versão atual e informações do sistema
npm run info
```

### Portas e URLs

Por padrão, o servidor será iniciado em:
- URL: http://localhost:3000
- Documentação da API: http://localhost:3000/api-docs

Para modificar a porta, defina a variável de ambiente PORT:
```bash
PORT=8080 npm run dev
```

## Documentação da API

A API utiliza o Swagger para documentação. Após iniciar o servidor, acesse:

```
http://localhost:3000/api-docs
```

A documentação inclui:
- Todos os endpoints disponíveis
- Parâmetros de entrada e saída de cada rota
- Modelos de dados
- Autenticação e segurança
- Testes de endpoints diretamente pela interface

Para obter a especificação OpenAPI em formato JSON, acesse:
```
http://localhost:3000/api-docs.json
```

### Logs e Monitoramento

Os logs do sistema são salvos em `logs/` e também exibidos no console durante a execução.

Para monitorar a API em tempo real:
```bash
npm run monitor
```

## Scripts de Banco de Dados

### Inicialização

O script `init-db.js` cria todas as tabelas necessárias no banco de dados:

```bash
npm run init:db
```

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

Para mais detalhes sobre os scripts de banco de dados, consulte [src/database/README.md](src/database/README.md). 