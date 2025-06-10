import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../../application/hooks/useAuth';
import { CircularProgress, Box } from '@mui/material';
import authService from '../../../infrastructure/api/authService';

const PrivateRoute = ({ children }) => {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const verifyAuth = async () => {
            try {
                setChecking(true);
                console.log('[PrivateRoute] Verificando autenticação...');
                
                // Restaurar token do localStorage e garantir que está configurado
                const tokenConfigured = authService.ensureTokenConfigured();
                
                // Verificar token no localStorage
                const token = authService.getToken();
                if (!token) {
                    console.log('[PrivateRoute] Token não encontrado');
                    if (isMounted) {
                        setAuthenticated(false);
                        setChecking(false);
                    }
                    return;
                }
                
                // Se o token existe no localStorage, considere autenticado para evitar
                // redirecionamentos desnecessários quando as requisições funcionam
                if (isMounted) {
                    setAuthenticated(true);
                    setChecking(false);
                }
                
                // Verificações adicionais de validação do token podem ser executadas
                // em background sem afetar o fluxo do usuário
                try {
                    authService.checkAuth().catch(error => {
                        console.warn('[PrivateRoute] Erro na verificação em segundo plano:', error);
                    });
                } catch (bgError) {
                    console.warn('[PrivateRoute] Erro na verificação em segundo plano:', bgError);
                }
            } catch (error) {
                console.error('[PrivateRoute] Erro ao verificar autenticação:', error);
                if (isMounted) {
                    setAuthenticated(false);
                    setChecking(false);
                }
            }
        };
        
        verifyAuth();
        
        // Limpeza para evitar memory leaks
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, location.pathname]);

    if (checking) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100vh'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!authenticated) {
        console.log('[PrivateRoute] Não autenticado, redirecionando para login');
        // Redireciona para o login mantendo a rota original
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    console.log('[PrivateRoute] Autenticado, renderizando componente');
    return children;
};

export default PrivateRoute; 