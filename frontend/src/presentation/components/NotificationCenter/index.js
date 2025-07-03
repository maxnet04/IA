import React, { useState } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Chip,
    Tooltip,
    ListItemButton,
    Button,
    CircularProgress
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useNotifications from '../../../application/hooks/useNotifications';

// A lógica de estilo será mantida para garantir fidelidade visual com os dados reais.
const getNotificationIcon = (type, read) => {
    if (read) {
        return <CheckCircleIcon style={{ color: '#4caf50' }} />;
    }
    switch(type) {
        case 'anomaly': return <WarningIcon style={{ color: '#ff9800' }} />;
        case 'recommendation': return <InfoIcon style={{ color: '#2196f3' }} />;
        case 'prediction_warning': return <InfoIcon style={{ color: '#2196f3' }} />;
        case 'error': return <ErrorIcon style={{ color: '#f44336' }} />;
        default: return <InfoIcon style={{ color: '#2196f3' }} />;
    }
};

const getAvatarBgColor = (read) => {
    return read ? '#e0e0e0' : 'rgba(0, 0, 0, 0.04)';
};

const formatNotificationDate = (dateString) => {
    try {
        // Suporta tanto string ISO quanto 'YYYY-MM-DD HH:mm:ss'
        let date = typeof dateString === 'string' && dateString.includes('T')
            ? new Date(dateString)
            : parseISO(dateString.replace(' ', 'T'));
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (e) {
        console.error("Data inválida para formatação:", dateString);
        return "Data inválida";
    }
};

// Função para cor de fundo clarinha baseada no tipo
const getNotificationBgColor = (type, isRead, hover = false) => {
    if (isRead) return hover ? 'rgba(76, 175, 80, 0.18)' : 'rgba(76, 175, 80, 0.08)'; // verde claro
    switch(type) {
        case 'anomaly': return hover ? 'rgba(255, 152, 0, 0.18)' : 'rgba(255, 152, 0, 0.06)'; // laranja
        case 'recommendation':
        case 'prediction':
        case 'prediction_warning':
            return hover ? 'rgba(33, 150, 243, 0.18)' : 'rgba(33, 150, 243, 0.06)'; // azul
        case 'error': return hover ? 'rgba(244, 67, 54, 0.18)' : 'rgba(244, 67, 54, 0.06)'; // vermelho
        default: return hover ? 'rgba(33, 150, 243, 0.10)' : 'rgba(33, 150, 243, 0.03)'; // fallback azul
    }
};

const getNotificationBorderColor = (type, isRead) => {
    if (isRead) return '#4caf50'; // verde
    switch(type) {
        case 'anomaly': return '#ff9800';
        case 'recommendation':
        case 'prediction':
        case 'prediction_warning': return '#2196f3';
        case 'error': return '#f44336';
        default: return '#2196f3';
    }
};

const NotificationCenter = ({ groupId = 'ALL' }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    
    // De volta aos dados reais do backend
    const {
        notifications,
        loading,
        error,
        unreadCount,
        markAsRead,
        markAllAsRead
    } = useNotifications(groupId);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    
    // Agora, esta função chama a API através do hook
    const handleMarkAsRead = (id) => {
        markAsRead(id);
    };

    // E esta também
    const handleMarkAllAsRead = () => {
        markAllAsRead();
        handleClose();
    };

    return (
        <>
            <Tooltip title="Notificações">
                <IconButton color="inherit" onClick={handleClick}>
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 380,
                        maxHeight: '80vh',
                        borderRadius: '8px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0,
                    }
                }}
            >
                <Box sx={{ p: '16px', flexShrink: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Notificações</Typography>
                    {unreadCount > 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Você tem {unreadCount} notificações não lidas
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Nenhuma notificação não lida
                        </Typography>
                    )}
                </Box>
                <Divider />

                {loading ? (
                    <Box sx={{ flexGrow: 1, display: 'grid', placeContent: 'center' }}><CircularProgress /></Box>
                ) : error ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 2, flexGrow: 1, display: 'grid', placeContent: 'center' }}><Typography>Nenhuma notificação</Typography></Box>
                ) : (
                    <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
                        {notifications.map((notification) => {
                            // Considera lida se read_at existe OU read === true
                            const isRead = !!notification.read_at || notification.read === true;

                            return (
                                <ListItemButton
                                    key={notification.id}
                                    onClick={() => !isRead && handleMarkAsRead(notification.id)}
                                    alignItems="flex-start"
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        borderLeft: `4px solid ${getNotificationBorderColor(notification.type, isRead)}`,
                                        backgroundColor: getNotificationBgColor(notification.type, isRead, false),
                                        transition: 'background-color 0.2s ease-in-out',
                                        '&:hover': {
                                            backgroundColor: getNotificationBgColor(notification.type, isRead, true)
                                        },
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 48, mt: 0.5 }}>
                                        <Avatar sx={{ bgcolor: getAvatarBgColor(isRead), width: 32, height: 32 }}>
                                            {getNotificationIcon(notification.type, isRead)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="body1" sx={{ fontWeight: isRead ? 400 : 600, color: 'text.primary', pr: 1 }}>
                                                    {notification.title || notification.type.replace(/_/g, ' ')}
                                                </Typography>
                                                {!isRead &&
                                                    <Chip label="Nova" size="small" sx={{ height: 22, borderRadius: '6px', bgcolor: '#2196f3', color: '#fff', fontWeight: 500 }} />
                                                }
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    {notification.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                                    {formatNotificationDate(notification.date)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
                
                {notifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1, textAlign: 'center', flexShrink: 0 }}>
                            <Button size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                                Marcar todas como lidas
                            </Button>
                        </Box>
                    </>
                )}
            </Popover>
        </>
    );
};

export default NotificationCenter; 