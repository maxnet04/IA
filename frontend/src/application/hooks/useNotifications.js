import { useState, useEffect, useCallback } from 'react';
import notificationService from '../../infrastructure/api/notificationService';

/**
 * Hook personalizado para gerenciar notificações
 * @returns {Object} Estado e funções para notificações
 */
const useNotifications = (productId) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await notificationService.getNotifications(productId);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (err) {
            setError('Erro ao carregar notificações');
            console.error('Erro ao carregar notificações:', err);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    /**
     * Marca uma notificação como lida
     * @param {string} notificationId - ID da notificação
     */
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Erro ao marcar notificação como lida:', err);
            throw err;
        }
    }, []);

    /**
     * Marca todas as notificações como lidas
     */
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead(productId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Erro ao marcar todas notificações como lidas:', err);
            throw err;
        }
    }, [productId]);

    return {
        notifications,
        loading,
        error,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loadNotifications
    };
};

export default useNotifications; 