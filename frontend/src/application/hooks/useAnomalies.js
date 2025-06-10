import { useState } from 'react';
import predictiveService from '../../infrastructure/api/predictiveService';

const useAnomalies = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [anomalies, setAnomalies] = useState([]);

    const loadAnomalies = async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const productId = filters.productId || 'ALL';
            console.log('Carregando anomalias para:', productId, 'entre', filters.startDate, 'e', filters.endDate);
            
            const result = await predictiveService.detectAnomalies(
                productId, 
                filters.startDate, 
                filters.endDate, 
                filters.severity,
                filters.limit || 20
            );
            
            // Verifica se o resultado tem formato esperado e contém anomalias
            if (result && result.success && result.data && result.data.anomalies) {
                console.log('Anomalias carregadas com sucesso:', result.data.anomalies.length);
                setAnomalies(result.data.anomalies);
            } else {
                console.warn('Resposta da API não contém anomalias:', result);
                setAnomalies([]);
                if (!result.success) {
                    setError(result.error || 'Resposta da API não contém anomalias');
                }
            }
        } catch (err) {
            console.error('Erro ao carregar anomalias:', err);
            setError(err.message || 'Erro ao carregar anomalias');
            setAnomalies([]);
        } finally {
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