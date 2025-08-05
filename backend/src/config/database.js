const DatabaseWrapper = require('./database-wrapper');

// Instância global do wrapper
const dbWrapper = new DatabaseWrapper();

function getConnection() {
  return dbWrapper.getConnection();
}

module.exports = {
  getConnection,
  dbPath: dbWrapper.dbPath
}; 