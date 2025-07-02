import axios from 'axios';
import groupService from './groupService';
import predictiveService from './predictiveService';
import incidentService from './incidentService';
import authService from './authService';
import notificationService from './notificationService';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Exportar serviços individuais
export {
    groupService,
    predictiveService,
    incidentService,
    authService,
    notificationService
};

export default api; 