import { useState, useEffect, useCallback } from 'react';
import notificationService from '../../infrastructure/api/notificationService';

/**
 * Hook personalizado para gerenciar notificações
 * @param {string} groupId - ID do grupo (opcional, padrão: 'ALL')
 * @returns {Object} Estado e funções para notificações
 */
const useNotifications = (groupId = 'ALL') => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await notificationService.getNotifications(groupId);
            
            // Correção: A API já retorna 'created_at'. O mapeamento anterior que
            // tentava usar 'timestamp' estava incorreto e causava o erro.
            setNotifications(data);

            // Considera lida se read_at existe OU read === true
            setUnreadCount(data.filter(n => !(!!n.read_at || n.read === true)).length);
        } catch (err) {
            setError('Erro ao carregar notificações');
            console.error('Erro ao carregar notificações:', err);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

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
                prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
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
            await notificationService.markAllAsRead(groupId);
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (err) {
            let msg = 'Erro ao marcar todas notificações como lidas';
            if (err && err.response && err.response.data && err.response.data.error) {
                msg += ': ' + err.response.data.error;
            }
            setError(msg);
            console.error(msg, err);
        }
    }, [groupId]);

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