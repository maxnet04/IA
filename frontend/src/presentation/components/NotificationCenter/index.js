import React, { useState } from 'react';
import {
    Badge,
    IconButton,
    Menu,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    ListItemAvatar,
    Avatar,
    Chip
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    InfoRounded as InfoIcon
} from '@mui/icons-material';
import useNotifications from '../../../application/hooks/useNotifications';

// Mapeamento preciso de ícones e cores para replicar a imagem
const notificationStyles = {
    anomaly: { icon: <WarningIcon />, color: '#f57c00' }, // Laranja para anomalia
    recommendation: { icon: <InfoIcon />, color: '#0288d1' }, // Azul para recomendação
    prediction_warning: { icon: <InfoIcon />, color: '#fbc02d' }, // Amarelo para previsão (fallback)
    read: { icon: <CheckCircleIcon style={{ color: '#fff' }}/>, color: '#bdbdbd' }, // Cinza para lida
    default: { icon: <InfoIcon />, color: '#546e7a' } // Padrão
};

function getNotificationAppearance(notification) {
    if (notification.read_at) { // Checa explicitamente por read_at
        return notificationStyles.read;
    }
    return notificationStyles[notification.type] || notificationStyles.default;
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'agora';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours}h`;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    }).replace('.', '') + ` às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

const NotificationCenter = ({ grupoDirecionado }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const {
        notifications,
        loading,
        error,
        unreadCount,
        markAsRead,
        markAllAsRead
    } = useNotifications(grupoDirecionado);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = (notificationId) => {
        markAsRead(notificationId);
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
        handleClose();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Tooltip title="Notificações">
                <IconButton color="inherit" onClick={handleClick}>
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        sx={{
                            '& .MuiBadge-badge': {
                                right: 5,
                                top: 5,
                                border: `2px solid #fff`,
                                padding: '0 4px',
                                fontSize: '0.7rem'
                            }
                        }}
                    >
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 360, maxHeight: 500 }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notificações</Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllAsRead}
                            startIcon={<CheckCircleIcon />}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </Box>

                <Divider />

                {loading ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography>Carregando notificações...</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography>Nenhuma notificação</Typography>
                    </Box>
                ) : (
                    <List sx={{ width: '100%', p: 0 }}>
                        {notifications.map((notification) => {
                            const { icon, color } = getNotificationAppearance(notification);
                            const isRead = notification.read_at;
                            return (
                                <ListItem
                                    key={notification.id}
                                    alignItems="flex-start"
                                    sx={{
                                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: color }}>
                                            {icon}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body1" sx={{ fontWeight: isRead ? 400 : 600, color: 'text.primary', pr: 1 }}>
                                                    {notification.title || notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace(/_/g, ' ')}
                                                </Typography>
                                                {!isRead &&
                                                    <Chip label="Nova" size="small" sx={{ height: 22, borderRadius: '6px', bgcolor: '#0288d1', color: '#fff' }} />
                                                }
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                >
                                                    {notification.description}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    {formatDate(notification.date)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    {!notification.read && (
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Marcar como lida">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Menu>
        </>
    );
};

export default NotificationCenter; 