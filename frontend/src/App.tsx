import { useEffect, useRef, useState } from 'react'
import './App.css'
import socket from '../utils/socket'
import { UserList } from './components/UserList'
import { CursorTracker } from './components/CursorTracker'
import { stringToColor } from './utils/colors'

interface Point {
  x: number
  y: number
}

interface DrawingElement {
  points: Point[]
  color: string
  width: number
}

function App() {
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const [elements, setElements] = useState<DrawingElement[]>([])
 const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `room-${Math.random().toString(36).substring(2, 8)}`
 })
 const [isDrawing, setIsDrawing] = useState(false)
 const [color, setColor] = useState('#000000')
 const [userCount, setUserCount] = useState(0)
 const [messages, setMessages] = useState<Array<{
   userId: string;
   message: string;
   timestamp: number;
 }>>([])

 useEffect(() => {
  const canvas = canvasRef.current
  if(!canvas) return 

  const context = canvas.getContext('2d');
  if(!context) return 

  context.clearRect(0, 0, canvas.width, canvas.height)

  elements.forEach((element) => {
    context.strokeStyle = element.color;
    context.lineWidth = element.width;
    context.beginPath()

    element.points.forEach((point, index) => {
      if(index === 0) {
        context.moveTo(point.x , point.y)
      }
      else  {
        context.lineTo(point.x, point.y)
      }
    })
    context.stroke()
  })
 })

useEffect(() => {
   socket.emit('joinRoom',roomId);
   socket.on('roomData', (roomData : {elements : DrawingElement[]}) => {
    setElements(roomData.elements)
   })

   socket.on('drawingUpdated' , (newElements : DrawingElement[]) => {
    setElements(newElements);
   });

   socket.on('drawingPointAdded', (data: {
     elementIndex: number,
     point: Point
   }) => {
     setElements(prev => {
       const newElements = [...prev]
       if (newElements[data.elementIndex]) {
         newElements[data.elementIndex].points.push(data.point)
       }
       return newElements
     })
   });

   // Chat message handler
   socket.on('newChatMessage', (message) => {
     setMessages(prev => [...prev, message]);
   });

   return () => {
    socket.off('drawingUpdated')
    socket.off('drawingPointAdded')
    socket.off('roomData')
    socket.off('userCount')
    socket.off('newChatMessage');
   }

},[roomId])


const startDrawing = (e:React.MouseEvent<HTMLCanvasElement>) =>{
  if(!canvasRef.current) return 
  const rect = canvasRef.current.getBoundingClientRect();
  const x  = e.clientX - rect.left
  const y = e.clientY-rect.top

  setIsDrawing(true)
  setElements(prev => [
    ...prev,
    {
      points: [{ x, y }],
      color,
      width: 5
    }
  ])
}

const endDrawing = () => {
  setIsDrawing(false)
  socket.emit('updateDrawing', { roomId, elements })
}

const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing || !canvasRef.current) return

  const rect = canvasRef.current.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  setElements(prev => {
    const newElements = [...prev]
    const lastElement = newElements[newElements.length - 1]
    lastElement.points.push({ x, y })
    
    socket.emit('drawingUpdate', {
      roomId,
      elementIndex: newElements.length - 1,
      point: { x, y }
    })
    
    return newElements
  })
}

  return (
    <div style={{ position: 'relative' }}>
      <div className="app">
        <h1>Collaborative Whiteboard</h1>
        <div className="controls">
          <div className="room-controls">
            <div>Room: {roomId}</div>
            <button onClick={() => navigator.clipboard.writeText(roomId)}>
              Copy Room ID
            </button>
            <input
              type="text"
              placeholder="Enter room ID"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setRoomId(e.currentTarget.value)
                }
              }}
            />
          </div>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
          />
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
        <CursorTracker roomId={roomId} />
        <UserList roomId={roomId} />
        
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className="message">
                <span className="user" style={{ color: stringToColor(msg.userId) }}>
                  User-{msg.userId.slice(0,4)}:
                </span>
                <span className="text">{msg.message}</span>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                socket.emit('chatMessage', {
                  roomId,
                  message: e.currentTarget.value,
                  userId: socket.id
                });
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
