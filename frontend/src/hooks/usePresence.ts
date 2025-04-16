import { useEffect, useState } from 'react';
import socket from '../../utils/socket';

export const usePresence = (roomId: string) => {
    const [activeUsers, setActiveUsers] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            socket.emit('presence', roomId);
        }, 5000);

        const handleUserDisconnected = (userId: string) => {
            setActiveUsers(prev => prev.filter(id => id !== userId));
        };

        socket.on('userDisconnected', handleUserDisconnected);

        return () => {
            clearInterval(interval);
            socket.off('userDisconnected', handleUserDisconnected);
        };
    }, [roomId]);

    return { activeUsers };
};
