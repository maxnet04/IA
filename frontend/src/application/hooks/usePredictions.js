import { useState, useEffect } from 'react';
import { predictiveService } from '../../infrastructure/api/predictiveService';

const usePredictions = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            setError(null);

            const today = new Date().toISOString().split('T')[0];
            const response = await predictiveService.getPredictedVolume(today, 'ALL');
            
            if (response.success && response.data) {
                setPredictions(response.data);
                setError(null);
            } else {
                console.warn('Resposta sem dados de previsão:', response);
                setError(response.error || 'Sem previsões disponíveis');
                setPredictions(null);
            }
        } catch (err) {
            console.error('Erro ao buscar previsões:', err);
            setError('Sem previsões disponíveis');
            setPredictions(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
        // Atualiza a cada 5 minutos
        const interval = setInterval(fetchPredictions, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { predictions, loading, error };
};

export default usePredictions; 