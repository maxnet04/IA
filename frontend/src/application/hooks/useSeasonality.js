import { useState, useEffect } from 'react';
import api from '../../infrastructure/api/axiosConfig';

/**
 * Hook para obter dados de sazonalidade
 * @param {string} groupId - ID do grupo ou 'ALL' para todos
 * @param {string} startDate - Data inicial (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @param {string} groupBy - Tipo de agrupamento ('day_of_week' ou 'month')
 * @returns {Object} Objeto contendo dados de sazonalidade, estado de carregamento e erro
 */
const useSeasonality = (groupId, startDate, endDate, groupBy = 'day_of_week') => {
  const [seasonalityData, setSeasonalityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeasonality = async () => {
      if (!groupId || !startDate || !endDate) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/predictive/seasonality', {
          params: {
            groupId,
            startDate,
            endDate,
            groupBy
          }
        });

        setSeasonalityData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados de sazonalidade:', err);
        setError(err.response?.data?.error || 'Falha ao obter análise de sazonalidade');
        setLoading(false);
      }
    };

    fetchSeasonality();
  }, [groupId, startDate, endDate, groupBy]);

  return { seasonalityData, loading, error };
};

export default useSeasonality; 