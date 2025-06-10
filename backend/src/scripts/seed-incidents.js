const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

function createTestIncidents() {
  console.log('Iniciando população de incidentes de teste...');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err.message);
      process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite.');
    
    // Lista de incidentes de teste para adicionar
    const incidentes = [
      {
        incidente: 'Falha no sistema de login',
        categoria: 'SISTEMA',
        grupoAtual: 'SUPORTE_TI',
        grupoDirecionado: 'DEV',
        dataCriacao: '2025-04-01T10:30:00.000Z',
        prioridade: 'ALTA',
        problema: 'Usuários não conseguem fazer login no sistema',
        analise: 'Possível problema na autenticação'
      },
      {
        incidente: 'Lentidão no processamento de pagamentos',
        categoria: 'FINANCEIRO',
        grupoAtual: 'FINANCEIRO',
        grupoDirecionado: 'INFRA',
        dataCriacao: '2025-04-02T14:15:00.000Z',
        prioridade: 'MEDIA',
        problema: 'Pagamentos demorando mais de 30 segundos para processar',
        analise: 'Alta demanda ou problema na infraestrutura'
      },
      {
        incidente: 'Erro no relatório mensal',
        categoria: 'RELATORIO',
        grupoAtual: 'GERENCIA',
        grupoDirecionado: 'SUPORTE_N2',
        dataCriacao: '2025-04-03T09:45:00.000Z',
        prioridade: 'BAIXA',
        problema: 'Relatório mensal apresentando valores incorretos',
        analise: 'Possível erro na fórmula de cálculo'
      },
      {
        incidente: 'Sistema fora do ar',
        categoria: 'SISTEMA',
        grupoAtual: 'SUPORTE_TI',
        grupoDirecionado: 'INFRA',
        dataCriacao: '2025-04-05T08:00:00.000Z',
        prioridade: 'CRITICA',
        problema: 'Sistema completamente indisponível',
        analise: 'Servidores não respondem'
      },
      {
        incidente: 'Dados inconsistentes',
        categoria: 'DADOS',
        grupoAtual: 'SUPORTE_N1',
        grupoDirecionado: 'DEV',
        dataCriacao: '2025-04-08T16:20:00.000Z',
        prioridade: 'ALTA',
        problema: 'Dados de clientes apresentando inconsistências',
        analise: 'Possível problema na sincronização'
      },
      {
        incidente: 'Interface lenta',
        categoria: 'FRONTEND',
        grupoAtual: 'SUPORTE_N1',
        grupoDirecionado: 'DEV',
        dataCriacao: '2025-04-10T11:05:00.000Z',
        prioridade: 'MEDIA',
        problema: 'Interface apresentando lentidão em todas as operações',
        analise: 'Possível excesso de requisições ou problema de memória'
      },
      {
        incidente: 'Erro de autenticação',
        categoria: 'SEGURANCA',
        grupoAtual: 'SUPORTE_N2',
        grupoDirecionado: 'SEGURANCA',
        dataCriacao: '2025-04-12T13:40:00.000Z',
        prioridade: 'ALTA',
        problema: 'Tentativas suspeitas de acesso detectadas',
        analise: 'Possível ataque de força bruta'
      },
      {
        incidente: 'Integração falhou',
        categoria: 'INTEGRACAO',
        grupoAtual: 'SUPORTE_TI',
        grupoDirecionado: 'DEV',
        dataCriacao: '2025-04-15T09:30:00.000Z',
        prioridade: 'ALTA',
        problema: 'Integração com sistema externo falhou',
        analise: 'API externa indisponível'
      },
      {
        incidente: 'Dados duplicados',
        categoria: 'DADOS',
        grupoAtual: 'SUPORTE_N2',
        grupoDirecionado: 'DADOS',
        dataCriacao: '2025-04-17T14:00:00.000Z',
        prioridade: 'MEDIA',
        problema: 'Registros duplicados no banco de dados',
        analise: 'Problema de sincronização entre servidores'
      },
      {
        incidente: 'Erro de processamento',
        categoria: 'BACKEND',
        grupoAtual: 'SUPORTE_TI',
        grupoDirecionado: 'DEV',
        dataCriacao: '2025-04-18T10:15:00.000Z',
        prioridade: 'ALTA',
        problema: 'Erro ao processar transações',
        analise: 'Exceção não tratada no código'
      }
    ];
    
    // Primeiro verificar se a tabela incidents existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='incidents'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar tabela:', err.message);
        closeDbAndExit(db, 1);
      }
      
      if (!row) {
        console.log('Tabela incidents não existe. Criando...');
        // Criar a tabela incidents
        db.run(`
          CREATE TABLE incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            INCIDENTE TEXT NOT NULL,
            CATEGORIA TEXT NOT NULL,
            GRUPO_ATUAL TEXT NOT NULL,
            GRUPO_DIRECIONADO TEXT,
            DATA_CRIACAO DATETIME NOT NULL,
            PRIORIDADE TEXT NOT NULL,
            PROBLEMA TEXT,
            SOLUCAO TEXT,
            DATA_ENCERRAMENTO DATETIME,
            USU_TRATAMENTO TEXT,
            ANALISE TEXT,
            ACAO TEXT CHECK(ACAO IN ('CANCELADO', 'RESOLVIDO', 'DIRECIONADO'))
          )
        `, insertIncidents);
      } else {
        insertIncidents();
      }
    });
    
    function insertIncidents(err) {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
        closeDbAndExit(db, 1);
      }
      
      console.log('Inserindo incidentes...');
      
      // Preparar a declaração de inserção
      const stmt = db.prepare(`
        INSERT INTO incidents 
        (INCIDENTE, CATEGORIA, GRUPO_ATUAL, GRUPO_DIRECIONADO, DATA_CRIACAO, PRIORIDADE, PROBLEMA, ANALISE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let count = 0;
      
      // Inserir cada incidente
      incidentes.forEach((incidente) => {
        stmt.run(
          incidente.incidente,
          incidente.categoria,
          incidente.grupoAtual,
          incidente.grupoDirecionado,
          incidente.dataCriacao,
          incidente.prioridade,
          incidente.problema,
          incidente.analise,
          function(err) {
            if (err) {
              console.error(`Erro ao inserir incidente '${incidente.incidente}':`, err.message);
            } else {
              console.log(`Incidente inserido com ID ${this.lastID}: ${incidente.incidente}`);
              count++;
            }
            
            // Se for o último incidente, finalize
            if (count === incidentes.length) {
              finishInsert();
            }
          }
        );
      });
      
      function finishInsert() {
        // Finalizar a declaração
        stmt.finalize();
        
        // Verificar o total de incidentes inseridos
        db.get('SELECT COUNT(*) as count FROM incidents', [], (err, row) => {
          if (err) {
            console.error('Erro ao contar incidentes:', err.message);
          } else {
            console.log(`Total de incidentes no banco de dados: ${row.count}`);
          }
          
          closeDbAndExit(db, 0);
        });
      }
    }
  });
}

function closeDbAndExit(db, code) {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar o banco de dados:', err.message);
    } else {
      console.log('Conexão com o banco de dados fechada.');
    }
    process.exit(code);
  });
}

createTestIncidents(); 