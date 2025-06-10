import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import PredictiveAnalysis from '../../components/PredictiveAnalysis';

const PredictiveAnalysisPage = () => {
    return (
        <MainLayout>
            <Box sx={{ py: 2 }}>
                <PredictiveAnalysis />
            </Box>
        </MainLayout>
    );
};

export default PredictiveAnalysisPage; 