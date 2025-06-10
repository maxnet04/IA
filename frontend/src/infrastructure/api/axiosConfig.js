import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const TOKEN_KEY = 'token';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Função para obter o token atual
const getAuthToken = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        console.warn('Token não encontrado no localStorage');
    } else {
        console.log('Token válido, expira em:', token.substring(0, 10) + '...');
    }
    return token;
};

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
    config => {
        try {
            // Obter token diretamente do localStorage para garantir que estamos usando o valor mais recente
            const token = localStorage.getItem(TOKEN_KEY);
            
            // Adiciona o token a todas as requisições apenas se parece ser um token válido
            if (token && token.length > 20) { // Verificação básica de tamanho mínimo para um JWT
                config.headers.Authorization = `Bearer ${token}`;
                console.log(`Token adicionado à requisição para: ${config.url}`);
                console.log('Token:', `Bearer ${token.substring(0, 10)}...`); // Mostra apenas parte do token por segurança
            } else if (token) {
                console.warn(`Token encontrado mas parece inválido (${token.length} caracteres) para: ${config.url}`);
            } else {
                console.warn(`Requisição sem token de autenticação para: ${config.url}`);
            }
            
            // Log de debug da requisição
            console.log(`Enviando requisição ${config.method.toUpperCase()} para: ${config.url}`, {
                params: config.params,
                headers: {
                    ...config.headers,
                    Authorization: config.headers.Authorization ? 'Bearer ***' : undefined
                }
            });
            
            config.withCredentials = true;
        } catch (error) {
            console.error('Erro ao processar token para requisição:', error);
        }
        return config;
    },
    error => {
        console.error('Erro no interceptor de requisição:', error);
        return Promise.reject(error);
    }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
    response => {
        // Log de sucesso
        console.log(`Resposta bem-sucedida (${response.status}) de: ${response.config.url}`);
        return response;
    },
    error => {
        // Registra o erro no console para debugging
        console.error('Erro na resposta da API:', error);
        
        if (error.response) {
            console.error(`Erro ${error.response.status} em requisição para: ${error.config.url}`);
            console.error('Detalhes da resposta:', error.response.data);
            
            // Tratamento específico para diferentes códigos de erro
            switch (error.response.status) {
                case 400:
                    return Promise.reject({
                        message: error.response.data?.message || 'Dados inválidos',
                        validationErrors: error.response.data?.errors,
                        status: 400
                    });
                    
                case 401:
                    // Erro de autenticação
                    console.warn('Erro de autenticação (401) detectado');
                    
                    // Limpar o token inválido se for um erro de autenticação
                    localStorage.removeItem(TOKEN_KEY);
                    
                    return Promise.reject({
                        message: 'Sessão expirada ou não autenticado',
                        status: 401
                    });
                    
                case 403:
                    return Promise.reject({
                        message: 'Acesso não autorizado',
                        status: 403
                    });
                    
                case 404:
                    return Promise.reject({
                        message: 'Recurso não encontrado',
                        status: 404
                    });
                    
                case 500:
                    return Promise.reject({
                        message: 'Erro interno do servidor. Tente novamente mais tarde.',
                        status: 500
                    });
                
                default:
                    return Promise.reject({
                        message: `Erro ${error.response.status}: ${error.response.statusText}`,
                        status: error.response.status
                    });
            }
        }
        
        // Erro de rede ou servidor indisponível
        if (!error.response) {
            return Promise.reject({
                message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
                status: 0
            });
        }
        
        return Promise.reject(error);
    }
);

// Configuração inicial - verifica se já existe um token no localStorage e o adiciona ao header padrão
const token = getAuthToken();
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token configurado nos cabeçalhos padrão do Axios');
}

export default api; 