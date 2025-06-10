import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../infrastructure/api/authService';

const useAuth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());

    // Verifica a autenticação quando o componente monta
    useEffect(() => {
        const checkAuth = async () => {
            // Primeiro, tenta restaurar o token do localStorage
            const tokenRestored = authService.ensureTokenConfigured();
            
            // Se há um token disponível, considera autenticado inicialmente
            // para evitar redirecionamentos desnecessários
            if (tokenRestored) {
                setIsLoggedIn(true);
                return;
            }
            
            // Se não tem token, verifica autenticação completa
            const authenticated = authService.isAuthenticated();
            setIsLoggedIn(authenticated);
            
            // Se não estiver autenticado e estiver em uma rota protegida, redireciona para login
            if (!authenticated && !location.pathname.includes('/login')) {
                console.log('[useAuth] Redirecionando para login...');
                navigate('/login', { replace: true });
            }
        };
        
        checkAuth();
    }, [location.pathname, navigate]);

    const login = useCallback(async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            console.log('[useAuth] Iniciando processo de login...');

            const result = await authService.login(username, password);
            
            if (result.success) {
                console.log('[useAuth] Login bem-sucedido, atualizando estado...');
                setIsLoggedIn(true);
                
                // Obtém o caminho original se disponível ou usa o dashboard como padrão
                const { from } = location.state || { from: '/dashboard' };
                console.log('[useAuth] Redirecionando para:', from);
                
                // Atualiza a URL com substituição para evitar voltar à tela de login
                navigate(from, { replace: true });
                return result;
            }
            
            throw new Error(result.message);
        } catch (err) {
            console.error('[useAuth] Erro no login:', err);
            setError(err.message || 'Erro ao realizar login');
            setIsLoggedIn(false);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [navigate, location]);

    const logout = useCallback(() => {
        console.log('[useAuth] Realizando logout...');
        authService.logout();
        setIsLoggedIn(false);
        navigate('/login', { replace: true });
    }, [navigate]);

    const isAuthenticated = useCallback(() => {
        // Garantir que o token esteja configurado antes de verificar a autenticação
        authService.ensureTokenConfigured();
        
        const authenticated = authService.isAuthenticated();
        
        // Atualiza o estado se for diferente
        if (authenticated !== isLoggedIn) {
            setIsLoggedIn(authenticated);
        }
        
        return authenticated;
    }, [isLoggedIn]);

    const getUser = useCallback(() => {
        return authService.getCurrentUser();
    }, []);

    return {
        login,
        logout,
        isAuthenticated,
        getUser,
        loading,
        error,
        isLoggedIn
    };
};

export default useAuth; 