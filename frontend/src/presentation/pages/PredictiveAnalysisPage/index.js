import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import PredictiveAnalysis from '../../components/PredictiveAnalysis';
import { useGroups } from '../../../application/hooks/useGroups';

const PredictiveAnalysisPage = () => {
    const { groups, loading: groupsLoading, error: groupsError } = useGroups();

    return (
        <MainLayout>
            <PredictiveAnalysis 
                groups={groups}
                groupsLoading={groupsLoading}
                groupsError={groupsError}
            />
        </MainLayout>
    );
};

export default PredictiveAnalysisPage; 