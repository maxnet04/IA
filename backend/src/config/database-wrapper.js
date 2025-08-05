const path = require('path');
const fs = require('fs');
const os = require('os');

// Wrapper para SQLite que funciona com pkg
class DatabaseWrapper {
  constructor() {
    this.isPkg = process.pkg !== undefined;
    this.dbPath = this.resolveDbPath();
    this.tempDbPath = null;
  }

  resolveDbPath() {
    // SEMPRE usa caminho relativo ao local do executável/projeto
    let dbPath;
    
    if (this.isPkg) {
      // Para PKG: procura data/database.sqlite ao lado do .exe
      const exeDir = path.dirname(process.execPath);
      dbPath = path.join(exeDir, 'data', 'database.sqlite');
      console.log('[DATABASE-WRAPPER] Modo PKG - Diretório do executável:', exeDir);
    } else {
      // Para desenvolvimento: usa caminho normal
      dbPath = path.resolve(__dirname, '../../data/database.sqlite');
      console.log('[DATABASE-WRAPPER] Modo desenvolvimento');
    }
    
    console.log('[DATABASE-WRAPPER] Caminho final do banco:', dbPath);
    console.log('[DATABASE-WRAPPER] Arquivo existe:', fs.existsSync(dbPath));
    
    // Cria diretório data se não existir
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      console.log('[DATABASE-WRAPPER] Criando diretório data:', dataDir);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    return dbPath;
  }

  async getConnection() {
    return new Promise((resolve, reject) => {
      console.log('[DATABASE-WRAPPER] === INICIANDO CONEXÃO ===');
      console.log('[DATABASE-WRAPPER] Modo PKG:', this.isPkg);
      console.log('[DATABASE-WRAPPER] Caminho do banco:', this.dbPath);
      console.log('[DATABASE-WRAPPER] Arquivo existe:', fs.existsSync(this.dbPath));
      console.log('[DATABASE-WRAPPER] Tamanho do arquivo:', fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 'N/A');
      
      // Sempre usa a mesma função de conexão
      this.connectWithSqlite3(resolve, reject);
    });
  }

  connectWithPkgWorkaround(resolve, reject) {
    console.log('[DATABASE-WRAPPER] === WORKAROUND PKG ===');
    console.log('[DATABASE-WRAPPER] Caminho final:', this.dbPath);
    console.log('[DATABASE-WRAPPER] Arquivo existe:', fs.existsSync(this.dbPath));
    console.log('[DATABASE-WRAPPER] Permissões do arquivo:', this.checkFilePermissions(this.dbPath));
    
    const sqlite3 = require('sqlite3').verbose();
    
    console.log('[DATABASE-WRAPPER] Criando nova instância Database...');
    
    // Tenta conectar diretamente com o arquivo físico
    const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      console.log('[DATABASE-WRAPPER] Callback de conexão chamado');
      if (err) {
        console.error('[DATABASE-WRAPPER] ❌ ERRO na conexão:');
        console.error('[DATABASE-WRAPPER] Mensagem:', err.message);
        console.error('[DATABASE-WRAPPER] Código:', err.code);
        console.error('[DATABASE-WRAPPER] Stack:', err.stack);
        reject(err);
      } else {
        console.log('[DATABASE-WRAPPER] ✅ Conexão PKG bem-sucedida!');
        console.log('[DATABASE-WRAPPER] Database instance criada:', !!db);
        resolve(db);
      }
    });
    
    // Log de eventos do banco
    db.on('error', (err) => {
      console.error('[DATABASE-WRAPPER] Evento de erro no banco:', err);
    });
    
    db.on('open', () => {
      console.log('[DATABASE-WRAPPER] Evento: banco aberto');
    });
  }

  connectWithSqlite3(resolve, reject) {
    console.log('[DATABASE-WRAPPER] === CONECTANDO COM SQLITE3 ===');
    const sqlite3 = require('sqlite3').verbose();
    
    const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('[DATABASE-WRAPPER] ❌ Erro na conexão:', err.message);
        console.error('[DATABASE-WRAPPER] Código do erro:', err.code);
        reject(err);
      } else {
        console.log('[DATABASE-WRAPPER] ✅ Conexão bem-sucedida!');
        resolve(db);
      }
    });
    
    // Log de eventos do banco
    db.on('error', (err) => {
      console.error('[DATABASE-WRAPPER] Evento de erro no banco:', err);
    });
    
    db.on('open', () => {
      console.log('[DATABASE-WRAPPER] Evento: banco aberto');
    });
  }

  // Verifica permissões do arquivo
  checkFilePermissions(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return 'Arquivo não existe';
      }
      
      const stats = fs.statSync(filePath);
      return {
        readable: fs.access ? true : 'N/A',
        writable: fs.access ? true : 'N/A', 
        size: stats.size,
        mode: stats.mode.toString(8),
        isFile: stats.isFile()
      };
    } catch (error) {
      return `Erro: ${error.message}`;
    }
  }

  // Método para salvar o banco de volta se necessário
  async saveDatabase() {
    if (this.isPkg && this.tempDbPath) {
      const originalDbPath = path.resolve(process.cwd(), 'data/database.sqlite');
      try {
        fs.copyFileSync(this.tempDbPath, originalDbPath);
        console.log('[DATABASE-WRAPPER] Banco salvo de volta para:', originalDbPath);
      } catch (error) {
        console.error('[DATABASE-WRAPPER] Erro ao salvar banco:', error.message);
      }
    }
  }
}

module.exports = DatabaseWrapper; 