import api from './axiosConfig';

// Chave para o token no localStorage - deve ser exatamente a mesma usada em axiosConfig.js
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Função para decodificar o token JWT sem validar
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

// Verifica se um token JWT está expirado
function isTokenExpired(token) {
    if (!token) return true;
    
    try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) return true;
        
        // O token contém a data de expiração em segundos desde a época Unix
        const expiry = decoded.exp * 1000; // Convertendo para milissegundos
        const currentTime = Date.now();
        
        // Adiciona uma margem de 30 segundos para evitar problemas de timing
        const isExpired = currentTime > (expiry - 30000);
        
        if (isExpired) {
            console.log('Token expirado:', { 
                expiryTime: new Date(expiry).toISOString(),
                currentTime: new Date(currentTime).toISOString(),
                expiresIn: Math.floor((expiry - currentTime) / 1000) + ' segundos'
            });
        } else {
            console.log('Token válido, expira em:', Math.floor((expiry - currentTime) / 1000), 'segundos');
        }
        
        return isExpired;
    } catch (error) {
        console.error('Erro ao verificar expiração do token:', error);
        return true;
    }
}

// Função auxiliar para atualizar o token em todas as instâncias
const updateTokenInAxios = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Token configurado globalmente no axios');
    } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('Token removido dos cabeçalhos globais do axios');
    }
};

const authService = {
    login: async (username, password) => {
        try {
            console.log('Tentando fazer login...', { username });
            
            const response = await api.post('/auth/login', {
                username,
                password
            });
            
            if (response.data && !response.data.error && response.data.data?.token) {
                const { token, user } = response.data.data;
                
                console.log('Login bem-sucedido, salvando token...');
                
                // Salva os dados no localStorage
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                
                // Configura o token no axios
                updateTokenInAxios(token);

                // Verificação adicional para garantir que o token foi salvo e configurado
                const savedToken = localStorage.getItem(TOKEN_KEY);
                if (savedToken) {
                    console.log('Token salvo com sucesso no localStorage:', savedToken.substring(0, 10) + '...');
                    console.log('Token válido, expira em:', Math.floor((decodeJWT(token).exp * 1000 - Date.now()) / 1000), 'segundos');
                } else {
                    console.error('ERRO: Falha ao salvar token no localStorage');
                }
                
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            }
            
            console.error('Resposta inválida do servidor ao fazer login:', response.data);
            throw new Error('Resposta inválida do servidor');
        } catch (error) {
            console.error('Erro no login:', error);
            throw {
                success: false,
                message: error.response?.data?.message || 'Erro ao realizar login',
                error: error
            };
        }
    },

    register: async (username, password, role = 'user') => {
        try {
            const response = await api.post('/auth/register', {
                username,
                password,
                role
            });
            return response.data;
        } catch (error) {
            console.error('Erro no registro:', error);
            if (error.response?.status === 409) {
                throw new Error('Usuário já existe');
            }
            throw error;
        }
    },

    logout: () => {
        console.log('Realizando logout...');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        updateTokenInAxios(null);
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem(USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    getToken: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            console.log('Token não encontrado pelo getToken()');
        } else {
            console.log('Token encontrado pelo getToken()', token.substring(0, 10) + '...');
        }
        return token;
    },

    isAuthenticated: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            console.log('Token não encontrado no localStorage');
            return false;
        }

        // Se o token existe mas não conseguimos decodificar, mas ainda assim as requisições estão funcionando,
        // é melhor considerar o usuário como autenticado para evitar problemas de UX
        try {
            // Verifica se o token está expirado
            if (isTokenExpired(token)) {
                console.log('Token expirado, realizando logout');
                authService.logout();
                return false;
            }
        } catch (error) {
            console.warn('Erro ao verificar expiração do token, mas mantendo sessão:', error);
            // Se não conseguir verificar a expiração por qualquer motivo técnico,
            // mas o token existe, consideramos válido para evitar logout desnecessário
        }

        // Token válido, configura no axios
        console.log('Token válido, configurando no axios');
        updateTokenInAxios(token);
        return true;
    },

    checkAuth: async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                console.log('Token não encontrado ao verificar autenticação');
                return false;
            }

            // Verificação rápida do lado do cliente se o token está expirado
            if (isTokenExpired(token)) {
                console.log('Token expirado durante verificação de autenticação');
                authService.logout();
                return false;
            }

            // Configura o token no cabeçalho
            updateTokenInAxios(token);
            
            console.log('Verificando token no servidor...');
            
            // Faz a requisição para o endpoint de verificação
            const response = await api.get('/auth/check');
            
            // Verifica se a resposta contém os dados esperados
            const isValid = response.data && 
                           !response.data.error && 
                           response.data.data?.valid === true;
                           
            console.log('Resultado da verificação de token:', isValid);
            
            if (!isValid) {
                console.log('Token inválido segundo o servidor, realizando logout');
                authService.logout();
            }
            
            return isValid;
        } catch (error) {
            console.error('Erro ao verificar autenticação no servidor:', error);
            
            // Não faz logout automático em caso de erro de conexão
            if (error.response?.status === 401) {
                authService.logout();
                return false;
            }
            
            // Em caso de outros erros, pode ser problema de conexão, então mantém o usuário logado
            return true;
        }
    },

    getAuthHeader: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? `Bearer ${token}` : null;
    },
    
    // Método para verificar e restaurar o token manualmente,
    // usado para resolver problemas onde o token não está sendo definido corretamente
    ensureTokenConfigured: () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                console.log('Restaurando token nos cabeçalhos do axios...');
                updateTokenInAxios(token);
                return true;
            }
        } catch (error) {
            console.error('Erro ao restaurar token:', error);
        }
        return false;
    }
};

// Executa ao importar para garantir que o token seja restaurado corretamente
authService.ensureTokenConfigured();

export default authService; 