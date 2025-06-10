import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import MainLayout from '../../layouts/MainLayout';

const ErrorPage = ({ error }) => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <Container maxWidth="md">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        textAlign: 'center',
                        py: 4
                    }}
                >
                    <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '8rem', fontWeight: 'bold', color: 'error.main' }}>
                        Erro
                    </Typography>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Ops! Algo deu errado
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {error?.message || 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.'}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        size="large"
                    >
                        Voltar à página anterior
                    </Button>
                </Box>
            </Container>
        </MainLayout>
    );
};

export default ErrorPage; 