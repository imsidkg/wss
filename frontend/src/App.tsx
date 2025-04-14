import { useEffect, useRef, useState } from 'react'
import './App.css'
import socket from '../utils/socket'

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
 const [roomId, setRoomId] = useState('default-room')
 const [isDrawing, setIsDrawing] = useState(false)
 const [color, setColor] = useState('#000000')
 const [userCount , setUserCount] = useState(0)

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
   })

   return () => {
    socket.off('drawingUpdated')
    socket.off('roomData')
    socket.off('userCount');
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
    return newElements
  })
}

  return (
    <>
     <div className="app">
      <h1>Collaborative Whiteboard</h1>
      <div className="controls">
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
    </div>
    </>
  )
}

export default App
