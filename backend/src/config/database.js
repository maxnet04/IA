const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

function getConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

module.exports = {
  getConnection,
  dbPath
}; 