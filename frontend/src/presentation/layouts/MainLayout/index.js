import React, { useState, useEffect } from 'react';
import { 
    Box, 
    AppBar, 
    Toolbar, 
    IconButton, 
    Button, 
    Typography,
    Container,
    Badge,
    Paper,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    useMediaQuery,
    Popover,
    Divider,
    Avatar,
    Card,
    ListItemAvatar,
    ListItemButton,
    Chip
} from '@mui/material';
import { 
    Notifications as NotificationsIcon,
    ExitToApp as LogoutIcon,
    Analytics as AnalyticsIcon,
    Dashboard as DashboardIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon,
    Lightbulb as LightbulbIcon,
    Menu as MenuIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../../infrastructure/api/authService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationCenter from '../../components/NotificationCenter';

const MainLayout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;



    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', label: 'DASHBOARD', icon: <DashboardIcon /> },
        { path: '/predictive', label: 'ANÁLISE PREDITIVA', icon: <AnalyticsIcon /> },
        { path: '/timeline', label: 'ANÁLISE TEMPORAL', icon: <TimelineIcon /> },
        { path: '/groups', label: 'ANÁLISE POR GRUPOS', icon: <GroupIcon /> },
        { path: '/anomalies', label: 'ANOMALIAS', icon: <WarningIcon /> },
        { path: '/recommendations', label: 'RECOMENDAÇÕES', icon: <LightbulbIcon /> }
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <List>
            {menuItems.map((item) => (
                <ListItem 
                    button 
                    key={item.path}
                    onClick={() => {
                        navigate(item.path);
                        handleDrawerToggle();
                    }}
                    selected={currentPath === item.path}
                >
                    <ListItemIcon>
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                </ListItem>
            ))}
        </List>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar 
                position="sticky" 
                elevation={0} 
                sx={{ 
                    bgcolor: '#0288d1',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                <Toolbar sx={{ 
                    minHeight: '64px !important',
                    paddingX: 2,
                    gap: 1,
                    flexWrap: 'nowrap',
                    overflow: 'visible'
                }}>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            flexGrow: 0, 
                            mr: 4, 
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            minWidth: 'max-content',
                            flexShrink: 0
                        }}
                    >
                        SUAT IA
                    </Typography>
                    
                    <Box sx={{ 
                        flexGrow: 1, 
                        display: { xs: 'none', md: 'flex' }, 
                        gap: 1 
                    }}>
                        {menuItems.map((item) => (
                            <Button
                                key={item.path}
                                color="inherit"
                                startIcon={item.icon}
                                onClick={() => navigate(item.path)}
                                variant={currentPath === item.path ? 'outlined' : 'text'}
                                sx={{
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1,
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    letterSpacing: '0.5px',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    ...(currentPath === item.path && {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    })
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    <NotificationCenter groupId="ALL" />
                    
                    <IconButton 
                        color="inherit" 
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                }}
            >
                {drawer}
            </Drawer>

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    py: 2, 
                    px: 1,
                    bgcolor: '#f5f5f5',
                    minHeight: 'calc(100vh - 64px - 56px)'
                }}
            >
                <Container maxWidth="xl" sx={{ maxWidth: '98% !important' }}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: 2,
                            bgcolor: 'white',
                            p: 2,
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                            width: '100%',
                            maxWidth: 'none'
                        }}
                    >
                        {children}
                    </Paper>
                </Container>
            </Box>

            <Box 
                component="footer" 
                sx={{ 
                    py: 3, 
                    bgcolor: 'white',
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                }}
            >
                <Container maxWidth="xl" sx={{ maxWidth: '98% !important' }}>
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        align="center"
                        sx={{ 
                            opacity: 0.8,
                            letterSpacing: '0.2px'
                        }}
                    >
                        © {new Date().getFullYear()} SUAT IA - Sistema Unificado de Análise e Tratamento de Incidentes
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout; 