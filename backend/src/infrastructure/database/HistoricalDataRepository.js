const { getConnection } = require('../../config/database');

class HistoricalDataRepository {
  async getProductById(productId) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM historical_data WHERE product_id = ?',
        [productId],
        (err, row) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async getAllProducts() {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM historical_data',
        [],
        (err, rows) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async getBaseVolume(productId) {
    const product = await this.getProductById(productId);
    return product ? product.base_volume : 0;
  }

  async updateBaseVolume(productId, newVolume) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE historical_data SET base_volume = ? WHERE product_id = ?',
        [newVolume, productId],
        function(err) {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }
}

module.exports = { HistoricalDataRepository }; 