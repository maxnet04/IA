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
    Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../../infrastructure/api/authService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MainLayout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const notificationOpen = Boolean(notificationAnchorEl);

    useEffect(() => {
        // Dados de exemplo - em produção, buscar do backend
        const mockNotifications = [
            {
                id: 1,
                title: 'Anomalia detectada',
                message: 'Volume acima do esperado para Produto A',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                type: 'warning',
                read: false
            },
            {
                id: 2,
                title: 'Nova recomendação',
                message: 'Redistribuição de recursos sugerida para o Grupo 2',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
                type: 'info',
                read: false
            },
            {
                id: 3,
                title: 'Previsão atualizada',
                message: 'Previsão de volume atualizada para o Produto B',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                type: 'success',
                read: true
            }
        ];
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleNotificationClick = (event) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleNotificationRead = (id) => {
        setNotifications(notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleViewAllNotifications = () => {
        // Navegar para uma página de todas as notificações
        // Por enquanto, apenas fecha o popover
        handleNotificationClose();
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'info':
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getNotificationColor = (type) => {
        switch(type) {
            case 'warning':
                return '#ff9800';
            case 'success':
                return '#4caf50';
            case 'error':
                return '#f44336';
            case 'info':
            default:
                return '#2196f3';
        }
    };

    const menuItems = [
        { path: '/dashboard', label: 'DASHBOARD', icon: <DashboardIcon /> },
        { path: '/predictive', label: 'ANÁLISE PREDITIVA', icon: <AnalyticsIcon /> },
        { path: '/timeline', label: 'ANÁLISE TEMPORAL', icon: <TimelineIcon /> },
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

                    <IconButton 
                        color="inherit"
                        onClick={handleNotificationClick}
                        aria-describedby="notification-menu"
                        sx={{ 
                            mr: 1,
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <Badge 
                            badgeContent={unreadCount} 
                            color="error"
                            sx={{
                                '& .MuiBadge-badge': {
                                    bgcolor: '#f44336',
                                    color: 'white'
                                }
                            }}
                        >
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    
                    <Popover
                        id="notification-menu"
                        open={notificationOpen}
                        anchorEl={notificationAnchorEl}
                        onClose={handleNotificationClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        PaperProps={{
                            sx: {
                                width: 400,
                                maxHeight: 500,
                                borderRadius: 1,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                            }
                        }}
                    >
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                                Notificações
                            </Typography>
                            {unreadCount > 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Você tem {unreadCount} notificações não lidas
                                </Typography>
                            )}
                        </Box>
                        
                        <List sx={{ p: 0 }}>
                            {notifications.length > 0 ? notifications.map((notification) => (
                                <ListItem 
                                    key={notification.id} 
                                    disablePadding
                                    secondaryAction={
                                        !notification.read && (
                                            <Chip 
                                                label="Nova" 
                                                color="primary" 
                                                size="small"
                                                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold' }}
                                            />
                                        )
                                    }
                                    sx={{
                                        bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                                        borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                                        py: 0.5,
                                        position: 'relative',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0.04,
                                            bgcolor: getNotificationColor(notification.type),
                                            transition: 'opacity 0.2s ease-in-out',
                                            pointerEvents: 'none',
                                        },
                                        '&:hover::before': {
                                            opacity: 0.08,
                                        }
                                    }}
                                >
                                    <ListItemButton 
                                        onClick={() => handleNotificationRead(notification.id)}
                                        sx={{
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar 
                                                sx={{ 
                                                    bgcolor: `${getNotificationColor(notification.type)}15`, 
                                                    width: 46, 
                                                    height: 46,
                                                    border: `1px solid ${getNotificationColor(notification.type)}30`
                                                }}
                                            >
                                                {getNotificationIcon(notification.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={notification.title}
                                            secondary={
                                                <>
                                                    <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5, mb: 0.5 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {format(notification.timestamp, "dd MMM 'às' HH:mm", { locale: ptBR })}
                                                    </Typography>
                                                </>
                                            }
                                            primaryTypographyProps={{
                                                fontWeight: notification.read ? 'normal' : 'bold',
                                                variant: 'subtitle2',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )) : (
                                <ListItem>
                                    <ListItemText 
                                        primary="Sem notificações"
                                        primaryTypographyProps={{
                                            align: 'center',
                                            color: 'text.secondary',
                                            py: 3
                                        }}
                                    />
                                </ListItem>
                            )}
                        </List>
                        
                        {notifications.length > 0 && (
                            <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                                <Button 
                                    onClick={handleViewAllNotifications}
                                    sx={{ fontSize: '0.95rem', fontWeight: 'medium', py: 1 }}
                                    variant="text"
                                    color="primary"
                                >
                                    Ver todas as notificações
                                </Button>
                            </Box>
                        )}
                    </Popover>
                    
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