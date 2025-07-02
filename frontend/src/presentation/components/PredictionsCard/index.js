import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Link
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const PredictionsCard = ({ predictions, loading, error }) => {
    if (loading) {
        return (
            <Card>
                <CardContent sx={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShowChartIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="h6" component="div">
                            Previsões
                        </Typography>
                    </Box>
                    <Link
                        component={RouterLink}
                        to="/predictive-analysis"
                        color="primary"
                        sx={{ textDecoration: 'none' }}
                    >
                        VER MAIS
                    </Link>
                </Box>

                {error || !predictions || predictions.predictedVolume === undefined ? (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                        Sem previsões disponíveis
                    </Typography>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" component="div">
                            {typeof predictions.predictedVolume === 'number' ? predictions.predictedVolume.toLocaleString() : '-'}
                        </Typography>
                        {predictions.trend !== undefined && predictions.trend !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <TrendingUpIcon 
                                    sx={{ 
                                        color: predictions.trend > 0 ? 'success.main' : 'error.main',
                                        mr: 0.5 
                                    }} 
                                />
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: predictions.trend > 0 ? 'success.main' : 'error.main'
                                    }}
                                >
                                    {Math.abs((predictions.trend * 100).toFixed(0))}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PredictionsCard; 