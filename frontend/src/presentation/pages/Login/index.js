import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    Checkbox,
    FormControlLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Fade
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Facebook, Twitter, Instagram } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useAuth from '../../../application/hooks/useAuth';

const theme = createTheme({
    palette: {
        primary: {
            main: '#0288d1',
            light: '#03a9f4',
            dark: '#0277bd',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#0277bd',
        },
        background: {
            default: '#0288d1',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            color: '#ffffff'
        },
        h4: {
            fontWeight: 600,
            color: '#0288d1'
        },
        subtitle1: {
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '2rem',
            fontSize: '1.1rem'
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '10px 20px',
                },
                containedPrimary: {
                    backgroundColor: '#0288d1',
                    '&:hover': {
                        backgroundColor: '#0277bd',
                    },
                },
                outlinedSecondary: {
                    borderColor: '#0288d1',
                    color: '#0288d1',
                    '&:hover': {
                        borderColor: '#0277bd',
                        backgroundColor: 'rgba(2, 136, 209, 0.04)',
                    },
                }
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: '#ffffff',
                        borderRadius: 8,
                        '&:hover fieldset': {
                            borderColor: '#0288d1',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#0288d1',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: '#0288d1',
                    '&.Mui-checked': {
                        color: '#0288d1',
                    },
                },
            },
        },
        MuiFormControlLabel: {
            styleOverrides: {
                label: {
                    color: '#0288d1',
                },
            },
        },
    },
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [registerData, setRegisterData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [formErrors, setFormErrors] = useState({
        username: '',
        password: ''
    });
    const [openRegister, setOpenRegister] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    const { login, loading, error } = useAuth();

    useEffect(() => {
        // Verifica se há o parâmetro expired=true na URL
        const searchParams = new URLSearchParams(location.search);
        const expired = searchParams.get('expired');
        
        if (expired === 'true') {
            setSessionExpired(true);
            
            // Remove o parâmetro expired da URL para evitar que a mensagem apareça após refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [location]);

    const validateField = (name, value) => {
        let error = '';
        if (!value) {
            error = `${name === 'username' ? 'Usuário' : 'Senha'} é obrigatório`;
        } else if (name === 'password' && value.length < 6) {
            error = 'A senha deve ter pelo menos 6 caracteres';
        }
        return error;
    };

    const handleChange = (e) => {
        // Limpa a mensagem de sessão expirada ao começar a digitar
        if (sessionExpired) {
            setSessionExpired(false);
        }
        
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        const error = validateField(name, value);
        setFormErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const isFormValid = () => {
        const errors = {
            username: validateField('username', formData.username),
            password: validateField('password', formData.password)
        };
        setFormErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid()) {
            return;
        }

        try {
            const result = await login(formData.username, formData.password);
            if (result.success) {
                // Login bem-sucedido, o redirecionamento é feito no hook useAuth
                console.log('Login realizado com sucesso:', result.message);
            }
        } catch (error) {
            // O erro já é tratado no hook useAuth
            console.error('Erro no login:', error.message);
        }
    };

    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
        setRegisterError('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!registerData.username || !registerData.password || !registerData.confirmPassword) {
            setRegisterError('Por favor, preencha todos os campos');
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setRegisterError('As senhas não coincidem');
            return;
        }

        if (registerData.password.length < 6) {
            setRegisterError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setRegisterLoading(true);
        setRegisterError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registerData.username,
                    password: registerData.password
                })
            });

            if (response.ok) {
                setOpenRegister(false);
                setRegisterData({ username: '', password: '', confirmPassword: '' });
            } else {
                const data = await response.json();
                setRegisterError(data.message || 'Erro ao realizar o cadastro');
            }
        } catch (error) {
            setRegisterError('Erro ao conectar ao servidor');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    background: 'linear-gradient(135deg, #4361ee 0%, #3f37c9 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Elementos decorativos de fundo */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        zIndex: 0,
                        background: 'url("/pattern.svg")',
                    }}
                />

                <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', py: 4, position: 'relative' }}>
                    <Grid container spacing={4} alignItems="center">
                        {/* Lado esquerdo - Mensagem de boas-vindas */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ color: '#fff', pr: { md: 8 } }}>
                                <Typography variant="h1" gutterBottom>
                                    Olá,<br />bem-vindo!
                                </Typography>
                                <Typography variant="subtitle1">
                                    Sistema Unificado de Análise e Tratamento de Incidentes
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Lado direito - Formulário de login */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={6} sx={{ p: 4, width: '100%', bgcolor: '#ffffff' }}>
                                <Box component="form" onSubmit={handleSubmit}>
                                    {/* Alerta de sessão expirada */}
                                    {sessionExpired && (
                                        <Alert 
                                            severity="warning" 
                                            sx={{ mb: 3 }}
                                        >
                                            Sua sessão expirou. Por favor, faça login novamente.
                                        </Alert>
                                    )}

                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label="Usuário"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        error={!!formErrors.username}
                                        helperText={formErrors.username}
                                        disabled={loading}
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        type="password"
                                        label="Senha"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={!!formErrors.password}
                                        helperText={formErrors.password}
                                        disabled={loading}
                                        sx={{ mb: 2 }}
                                    />

                                    {error && (
                                        <Fade in={!!error}>
                                            <Alert 
                                                severity="error" 
                                                sx={{ 
                                                    mt: 2,
                                                    mb: 2,
                                                    '& .MuiAlert-message': {
                                                        width: '100%',
                                                        textAlign: 'center'
                                                    }
                                                }}
                                            >
                                                {error}
                                            </Alert>
                                        </Fade>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                    color="primary"
                                                />
                                            }
                                            label="Lembrar-me"
                                        />
                                        <Button
                                            variant="text"
                                            color="primary"
                                            onClick={() => {}}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Esqueceu a senha?
                                        </Button>
                                    </Box>

                                    <LoadingButton
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        loading={loading}
                                        disabled={Object.values(formErrors).some(error => error)}
                                        sx={{ mt: 3, mb: 2 }}
                                    >
                                        Entrar
                                    </LoadingButton>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => setOpenRegister(true)}
                                        >
                                            Cadastrar
                                        </Button>
                                    </Box>

                                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            SIGA-NOS
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                            <IconButton size="small" color="primary">
                                                <Facebook />
                                            </IconButton>
                                            <IconButton size="small" color="primary">
                                                <Twitter />
                                            </IconButton>
                                            <IconButton size="small" color="primary">
                                                <Instagram />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Modal de Cadastro */}
            <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Criar nova conta</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="register-username"
                            label="E-mail"
                            name="username"
                            autoComplete="email"
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            error={!!registerError}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Senha"
                            type="password"
                            id="register-password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            error={!!registerError}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmar Senha"
                            type="password"
                            id="register-confirm-password"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            error={!!registerError}
                            sx={{ mb: 2 }}
                        />

                        {registerError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {registerError}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegister(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRegister}
                        variant="contained"
                        disabled={registerLoading}
                    >
                        {registerLoading ? <CircularProgress size={24} /> : 'Cadastrar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
};

export default Login; 