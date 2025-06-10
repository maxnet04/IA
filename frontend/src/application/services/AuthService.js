class AuthService {
    constructor() {
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error('Erro de conexão com o servidor');
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao fazer login');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Erro no serviço de autenticação:', error);
            throw error;
        }
    }

    // ... existing code ...
} 