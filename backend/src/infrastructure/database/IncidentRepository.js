const { getConnection } = require('../../config/database');

class IncidentRepository {
  async getIncidentsByDateRange(productId, startDate, endDate) {
    const db = await getConnection();
    return new Promise((resolve, reject) => {
      let query;
      const params = [];
      if (productId === 'ALL') {
        query = `
          SELECT *
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          ORDER BY DATA_CRIACAO ASC
        `;
        params.push(startDate, endDate);
      } else {
        query = `
          SELECT *
          FROM incidents 
          WHERE product_id = ? AND DATA_CRIACAO BETWEEN ? AND ?
          ORDER BY DATA_CRIACAO ASC
        `;
        params.push(productId, startDate, endDate);
      }
      db.all(query, params, (err, rows) => {
        db.close();
        if (err) reject(err);
        else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async getConsolidatedIncidents(productId, startDate, endDate, category = null) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      let query;
      const params = [];
      
      const categoryFilter = category ? 'AND CATEGORIA = ?' : '';
      
      if (productId === 'ALL') {
        query = `
          SELECT 
            'ALL' as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(startDate, endDate);
        if (category) params.push(category);
      } else {
        query = `
          SELECT 
            ? as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            CATEGORIA,
            GRUPO_DIRECIONADO,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
          
        params.push(productId, startDate, endDate);
        if (category) params.push(category);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async getAnomalies(productId, startDate, endDate) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      let query;
      const params = [];

      if (productId === 'ALL') {
        query = `
          SELECT 
            'ALL' as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO,
            '' as anomaly_type,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(startDate, endDate);
      } else {
        query = `
          SELECT 
            ? as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            CATEGORIA,
            GRUPO_DIRECIONADO,
            '' as anomaly_type,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(productId, startDate, endDate);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async getIncidentsByCategory(productId, startDate, endDate, category) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      let query;
      const params = [];

      if (productId === 'ALL') {
        query = `
          SELECT 
            'ALL' as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          AND CATEGORIA = ?
          GROUP BY DATE(DATA_CRIACAO), CATEGORIA
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(startDate, endDate, category);
      } else {
        query = `
          SELECT 
            ? as product_id,
            DATA_CRIACAO as incident_date,
            COUNT(*) as volume,
            CATEGORIA,
            GRUPO_DIRECIONADO,
            COUNT(*) as incident_count
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          AND CATEGORIA = ?
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(productId, startDate, endDate, category);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async getDailyVolumes(productId, startDate, endDate) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      let query;
      const params = [];
      
      if (productId === 'ALL') {
        query = `
          SELECT 
            DATA_CRIACAO as incident_date,
            COUNT(*) as total_volume
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
        
        params.push(startDate, endDate);
      } else {
        query = `
          SELECT 
            DATA_CRIACAO as incident_date,
            COUNT(*) as total_volume
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          GROUP BY DATE(DATA_CRIACAO)
          ORDER BY DATA_CRIACAO ASC`;
          
        params.push(startDate, endDate);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async getCategoryDistribution(productId, startDate, endDate) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      let query;
      const params = [];

      if (productId === 'ALL') {
        query = `
          SELECT 
            CATEGORIA, 
            COUNT(*) as count,
            SUM(COUNT(*)) OVER() as total_volume
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          AND CATEGORIA != 'CONSOLIDADO'
          GROUP BY CATEGORIA
          ORDER BY COUNT(*) DESC`;
        
        params.push(startDate, endDate);
      } else {
        query = `
          SELECT 
            CATEGORIA, 
            COUNT(*) as count,
            SUM(COUNT(*)) OVER() as total_volume
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          AND CATEGORIA != 'CONSOLIDADO'
          GROUP BY CATEGORIA
          ORDER BY count DESC`;
          
        params.push(startDate, endDate);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const adjustedRows = rows.map(row => ({
            ...row,
            incident_date: row.incident_date ? row.incident_date.slice(0, 10) : undefined
          }));
          resolve(adjustedRows);
        }
      });
    });
  }

  async markAsAnomaly(incidentId, anomalyType) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE incidents SET is_anomaly = 1, anomaly_type = ? WHERE id = ?`,
        [anomalyType, incidentId],
        function(err) {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  async addIncident(incident) {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO incidents (
          product_id, DATA_CRIACAO, DATA_ENCERRAMENTO,
          CATEGORIA, GRUPO_DIRECIONADO, PRIORIDADE, ACAO,
          volume, is_anomaly, anomaly_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incident.product_id,
          incident.DATA_CRIACAO,
          incident.DATA_ENCERRAMENTO,
          incident.CATEGORIA,
          incident.GRUPO_DIRECIONADO,
          incident.PRIORIDADE,
          incident.ACAO,
          incident.volume || 1,
          incident.is_anomaly || 0,
          incident.anomaly_type || ''
        ],
        function(err) {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  async getMonthlyConsolidatedIncidents(productId, startDate, endDate, category = null) {
    const db = await getConnection();
    return new Promise((resolve, reject) => {
      let query;
      const params = [];
      const categoryFilter = category ? 'AND CATEGORIA = ?' : '';
      if (productId === 'ALL') {
        query = `
          SELECT 
            strftime('%Y-%m', DATA_CRIACAO) as incident_month,
            'ALL' as product_id,
            SUM(volume) as volume,
            COUNT(*) as incident_count,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY incident_month
          ORDER BY incident_month ASC`;
        params.push(startDate, endDate);
        if (category) params.push(category);
      } else {
        query = `
          SELECT 
            strftime('%Y-%m', DATA_CRIACAO) as incident_month,
            ? as product_id,
            SUM(volume) as volume,
            COUNT(*) as incident_count,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO
          FROM incidents 
          WHERE product_id = ? AND DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY incident_month
          ORDER BY incident_month ASC`;
        params.push(productId, productId, startDate, endDate);
        if (category) params.push(category);
      }
      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getMonthlyConsolidatedIncidentsByGroup(groupId, startDate, endDate, category = null) {
    const db = await getConnection();
    return new Promise((resolve, reject) => {
      let query;
      const params = [];
      const categoryFilter = category ? 'AND CATEGORIA = ?' : '';
      if (groupId === 'ALL') {
        query = `
          SELECT 
            strftime('%Y-%m', DATA_CRIACAO) as incident_month,
            'ALL' as group_id,
            SUM(volume) as volume,
            COUNT(*) as incident_count,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY incident_month
          ORDER BY incident_month ASC`;
        params.push(startDate, endDate);
        if (category) params.push(category);
      } else {
        query = `
          SELECT 
            strftime('%Y-%m', DATA_CRIACAO) as incident_month,
            ? as group_id,
            SUM(volume) as volume,
            COUNT(*) as incident_count,
            GROUP_CONCAT(DISTINCT CATEGORIA) as CATEGORIA,
            GROUP_CONCAT(DISTINCT GRUPO_DIRECIONADO) as GRUPO_DIRECIONADO
          FROM incidents 
          WHERE GRUPO_DIRECIONADO = ? AND DATA_CRIACAO BETWEEN ? AND ? ${categoryFilter}
          GROUP BY incident_month
          ORDER BY incident_month ASC`;
        params.push(groupId, groupId, startDate, endDate);
        if (category) params.push(category);
      }
      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getIncidentsByDateRangeAndGroup(groupId, startDate, endDate) {
    const db = await getConnection();
    return new Promise((resolve, reject) => {
      let query;
      const params = [];

      if (groupId === 'ALL') {
        query = `
          SELECT 
            DATE(DATA_CRIACAO) as incident_date,
            GRUPO_DIRECIONADO,
            CATEGORIA,
            volume,
            is_anomaly,
            DATA_CRIACAO
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ?
          ORDER BY DATA_CRIACAO ASC
        `;
        params.push(startDate, endDate);
      } else {
        query = `
          SELECT 
            DATE(DATA_CRIACAO) as incident_date,
            GRUPO_DIRECIONADO,
            CATEGORIA,
            volume,
            is_anomaly,
            DATA_CRIACAO
          FROM incidents 
          WHERE DATA_CRIACAO BETWEEN ? AND ? 
            AND GRUPO_DIRECIONADO = ?
          ORDER BY DATA_CRIACAO ASC
        `;
        params.push(startDate, endDate, groupId);
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          console.error('Erro ao buscar incidentes por grupo e período:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

module.exports = { IncidentRepository }; 