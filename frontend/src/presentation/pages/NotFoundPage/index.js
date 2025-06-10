import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';
import MainLayout from '../../layouts/MainLayout';

const NotFoundPage = () => {
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
                    <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '8rem', fontWeight: 'bold' }}>
                        404
                    </Typography>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Página não encontrada
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        A página que você está procurando não existe ou foi movida.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<HomeIcon />}
                        onClick={() => navigate('/')}
                        size="large"
                    >
                        Voltar para a página inicial
                    </Button>
                </Box>
            </Container>
        </MainLayout>
    );
};

export default NotFoundPage; 