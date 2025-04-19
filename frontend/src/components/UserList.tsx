import { usePresence } from '../hooks/usePresence';
import { stringToColor } from '../utils/colors';

export const UserList = ({ roomId }: { roomId: string }) => {
  const { activeUsers } = usePresence(roomId);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255,255,255,0.9)',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0 }}>Active Users</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {activeUsers.map(userId => (
          <li key={userId} style={{ 
            display: 'flex', 
            alignItems: 'center',
            margin: '5px 0'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: stringToColor(userId),
              marginRight: '8px'
            }} />
            User-{userId.slice(0, 4)}
          </li>
        ))}
      </ul>
    </div>
  );
};
