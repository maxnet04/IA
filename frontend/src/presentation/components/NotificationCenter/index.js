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
    Divider
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import useNotifications from '../../../application/hooks/useNotifications';

const NotificationCenter = ({ productId }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const {
        notifications,
        loading,
        error,
        unreadCount,
        markAsRead,
        markAllAsRead
    } = useNotifications(productId);

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
                    <Badge badgeContent={unreadCount} color="error">
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
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                alignItems="flex-start"
                                sx={{
                                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                                    '&:hover': { bgcolor: 'action.selected' }
                                }}
                            >
                                <ListItemIcon>
                                    <WarningIcon color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={notification.title}
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
                        ))}
                    </List>
                )}
            </Menu>
        </>
    );
};

export default NotificationCenter; 