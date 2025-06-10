import React from 'react';
import { Grid } from '@mui/material';
import PredictionsCard from '../../components/PredictionsCard';
import usePredictions from '../../../application/hooks/usePredictions';

const Dashboard = () => {
    const { predictions, loading, error } = usePredictions();

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
                <PredictionsCard 
                    predictions={predictions}
                    loading={loading}
                    error={error}
                />
            </Grid>
            {/* Outros cards do dashboard */}
        </Grid>
    );
};

export default Dashboard; 