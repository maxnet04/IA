import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../presentation/components/PrivateRoute';
import Login from '../presentation/pages/Login';
import DashboardPage from '../presentation/pages/DashboardPage';
import PredictiveAnalysisPage from '../presentation/pages/PredictiveAnalysisPage';
import AnomaliesPage from '../presentation/pages/AnomaliesPage';
import RecommendationsPage from '../presentation/pages/RecommendationsPage';
import TimelineAnalysisPage from '../presentation/pages/TimelineAnalysisPage';
import GroupAnalysisPage from '../presentation/pages/GroupAnalysisPage';
import NotFoundPage from '../presentation/pages/NotFoundPage';
import useAuth from '../application/hooks/useAuth';

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Rota raiz - Redireciona para dashboard se autenticado, senão para login */}
            <Route path="/" element={
                isAuthenticated() ? (
                    <Navigate to="/dashboard" replace />
                ) : (
                    <Navigate to="/login" replace />
                )
            } />

            {/* Rota de login - Redireciona para dashboard se já estiver autenticado */}
            <Route path="/login" element={
                isAuthenticated() ? (
                    <Navigate to="/dashboard" replace />
                ) : (
                    <Login />
                )
            } />
            
            {/* Rotas protegidas */}
            <Route path="/dashboard" element={
                <PrivateRoute>
                    <DashboardPage />
                </PrivateRoute>
            } />
            
            <Route path="/predictive" element={
                <PrivateRoute>
                    <PredictiveAnalysisPage />
                </PrivateRoute>
            } />
            
            <Route path="/timeline" element={
                <PrivateRoute>
                    <TimelineAnalysisPage />
                </PrivateRoute>
            } />
            
            <Route path="/anomalies" element={
                <PrivateRoute>
                    <AnomaliesPage />
                </PrivateRoute>
            } />
            
            <Route path="/recommendations" element={
                <PrivateRoute>
                    <RecommendationsPage />
                </PrivateRoute>
            } />
            
            <Route path="/groups" element={
                <PrivateRoute>
                    <GroupAnalysisPage />
                </PrivateRoute>
            } />
            
            {/* Rotas de erro */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    );
};

export default AppRoutes; 