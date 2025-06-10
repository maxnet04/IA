import { useState, useEffect, useCallback } from 'react';
import predictiveService from '../../infrastructure/api/predictiveService';

const useRecommendations = (initialProductId = '', initialDate = '') => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productId, setProductId] = useState(initialProductId);
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(3);

  // Função para carregar recomendações
  const fetchRecommendations = useCallback(async () => {
    if (!productId || !date) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await predictiveService.getRecommendations(productId, date, category, limit);
      
      if (response.success) {
        // Normaliza a estrutura de dados da resposta para garantir consistência
        const recData = response.data.data?.recommendations || response.data.recommendations || [];
        setRecommendations(recData);
      } else {
        setError(response.error || 'Erro ao carregar recomendações');
      }
    } catch (err) {
      console.error('Erro ao buscar recomendações:', err);
      setError(err.message || 'Falha na requisição');
    } finally {
      setLoading(false);
    }
  }, [productId, date, category, limit]);

  // Carrega recomendações quando os parâmetros mudam
  useEffect(() => {
    if (productId && date) {
      fetchRecommendations();
    }
  }, [fetchRecommendations]);

  // Função para filtrar recomendações por categoria
  const filterByCategory = useCallback((newCategory) => {
    setCategory(newCategory);
  }, []);

  // Função para alterar o limite de recomendações
  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
  }, []);

  // Função para atualizar o produto
  const changeProduct = useCallback((newProductId) => {
    setProductId(newProductId);
  }, []);

  // Função para atualizar a data
  const changeDate = useCallback((newDate) => {
    setDate(newDate);
  }, []);

  // Função para forçar o recarregamento das recomendações
  const refreshRecommendations = useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    productId,
    date,
    category,
    limit,
    filterByCategory,
    changeLimit,
    changeProduct,
    changeDate,
    refreshRecommendations
  };
};

export default useRecommendations; 