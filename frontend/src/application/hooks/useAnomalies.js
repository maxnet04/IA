import { useState, useRef } from 'react';
import predictiveService from '../../infrastructure/api/predictiveService';

const useAnomalies = () => {
    console.log('🔍 [DEBUG ANOMALIES] useAnomalies hook inicializado');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    
    // Controle para evitar chamadas duplicadas
    const isLoadingRef = useRef(false);
    const lastRequestRef = useRef(null);

    const loadAnomalies = async (filters = {}) => {
        console.log('🔍 [DEBUG ANOMALIES] loadAnomalies chamado');
        console.log('🔍 [DEBUG ANOMALIES] Filtros:', filters);
        
        // Criar chave única para esta requisição
        const requestKey = `${filters.groupId || filters.productId || 'ALL'}-${filters.startDate}-${filters.endDate}-${filters.severity}-${filters.limit || 20}`;
        console.log('🔍 [DEBUG ANOMALIES] Chave da requisição:', requestKey);
        
        // Verificar se já está carregando ou se é a mesma requisição
        if (isLoadingRef.current) {
            console.log('🔍 [DEBUG ANOMALIES] loadAnomalies cancelado - já está carregando');
            return;
        }
        
        if (lastRequestRef.current === requestKey) {
            console.log('🔍 [DEBUG ANOMALIES] loadAnomalies cancelado - requisição duplicada');
            return;
        }
        
        try {
            console.log('🔍 [DEBUG ANOMALIES] Iniciando chamada para API...');
            isLoadingRef.current = true;
            lastRequestRef.current = requestKey;
            setLoading(true);
            setError(null);
            
            const groupId = filters.groupId || filters.productId || 'ALL';
            console.log('🔍 [DEBUG ANOMALIES] Carregando anomalias para:', groupId, 'entre', filters.startDate, 'e', filters.endDate);
            
            const result = await predictiveService.detectAnomalies(
                groupId, 
                filters.startDate, 
                filters.endDate, 
                filters.severity,
                filters.limit || 20
            );
            
            console.log('🔍 [DEBUG ANOMALIES] Resposta da API recebida:', result);
            
            // Verifica se o resultado tem formato esperado e contém anomalias
            if (result && result.success && result.data && result.data.anomalies) {
                console.log('🔍 [DEBUG ANOMALIES] Anomalias carregadas com sucesso:', result.data.anomalies.length);
                setAnomalies(result.data.anomalies);
            } else {
                console.warn('🔍 [DEBUG ANOMALIES] Resposta da API não contém anomalias:', result);
                setAnomalies([]);
                if (!result.success) {
                    setError(result.error || 'Resposta da API não contém anomalias');
                }
            }
        } catch (err) {
            console.error('🔍 [DEBUG ANOMALIES] Erro ao carregar anomalias:', err);
            setError(err.message || 'Erro ao carregar anomalias');
            setAnomalies([]);
        } finally {
            console.log('🔍 [DEBUG ANOMALIES] Finalizando loadAnomalies');
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        anomalies,
        loadAnomalies
    };
};

export default useAnomalies; 