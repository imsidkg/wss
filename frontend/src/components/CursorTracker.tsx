import { useEffect, useState, useRef } from 'react';
import socket from '../../utils/socket';
import { stringToColor } from '../utils/colors';

interface RemoteCursor {
  position: { x: number; y: number };
  color: string;
  name: string;
  lastUpdated: number;
}

export const CursorTracker = ({ roomId }: { roomId: string }) => {
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const lastSentRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSentRef.current < 100) return;
      lastSentRef.current = now;
      
      socket.emit('cursorMove', {
        roomId,
        position: { x: e.clientX, y: e.clientY }
      })
    };

    const handleCursorMove = (data: {
      userId: string;
      position: { x: number; y: number };
    }) => {
      setCursors(prev => ({
        ...prev,
        [data.userId]: {
          position: data.position,
          color: stringToColor(data.userId),
          name: `User-${data.userId.slice(0, 4)}`,
          lastUpdated: Date.now()
        }
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    socket.on('userCursor', (data) => {
      handleCursorMove(data)
    });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.off('userCursor', handleCursorMove);
    };
  }, [roomId]);

  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div 
          key={userId}
          style={{
            position: 'absolute',
            left: cursor.position.x,
            top: cursor.position.y,
            backgroundColor: cursor.color,
            width: '15px',
            height: '15px',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        />
      ))}
    </>
  );
};
