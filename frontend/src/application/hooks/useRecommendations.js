import { useState, useEffect, useCallback, useRef } from 'react';
import predictiveService from '../../infrastructure/api/predictiveService';

const useRecommendations = (initialGroupId = '', initialDate = '') => {
  console.log('🔍 [DEBUG] useRecommendations hook inicializado');
  console.log('🔍 [DEBUG] Parâmetros iniciais - groupId:', initialGroupId, 'date:', initialDate);
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(3);
  
  // Controle para evitar chamadas duplicadas
  const isLoadingRef = useRef(false);
  const lastRequestRef = useRef(null);

  // Função para carregar recomendações
  const fetchRecommendations = useCallback(async () => {
    console.log('🔍 [DEBUG] fetchRecommendations chamado');
    console.log('🔍 [DEBUG] Parâmetros - groupId:', groupId, 'date:', date, 'category:', category, 'limit:', limit);
    
    if (!groupId || !date) {
      console.log('🔍 [DEBUG] fetchRecommendations cancelado - parâmetros inválidos');
      return;
    }

    // Criar chave única para esta requisição
    const requestKey = `${groupId}-${date}-${category}-${limit}`;
    console.log('🔍 [DEBUG] Chave da requisição:', requestKey);
    
    // Verificar se já está carregando ou se é a mesma requisição
    if (isLoadingRef.current) {
      console.log('🔍 [DEBUG] fetchRecommendations cancelado - já está carregando');
      return;
    }
    
    if (lastRequestRef.current === requestKey) {
      console.log('🔍 [DEBUG] fetchRecommendations cancelado - requisição duplicada');
      return;
    }

    console.log('🔍 [DEBUG] Iniciando chamada para API...');
    isLoadingRef.current = true;
    lastRequestRef.current = requestKey;
    setLoading(true);
    setError(null);

    try {
      const response = await predictiveService.getRecommendations(groupId, date, category, limit);
      console.log('🔍 [DEBUG] Resposta da API recebida:', response);
      
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
      console.log('🔍 [DEBUG] Finalizando fetchRecommendations');
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [groupId, date, category, limit]);

  // Carrega recomendações quando os parâmetros mudam
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect do useRecommendations disparado');
    console.log('🔍 [DEBUG] Condições - groupId:', groupId, 'date:', date);
    if (groupId && date) {
      console.log('🔍 [DEBUG] Condições atendidas, chamando fetchRecommendations...');
      fetchRecommendations();
    } else {
      console.log('🔍 [DEBUG] Condições não atendidas, não chamando fetchRecommendations');
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

  // Função para atualizar o grupo
  const changeGroup = useCallback((newGroupId) => {
    setGroupId(newGroupId);
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
    groupId,
    date,
    category,
    limit,
    filterByCategory,
    changeLimit,
    changeGroup,
    changeDate,
    refreshRecommendations
  };
};

export default useRecommendations; 