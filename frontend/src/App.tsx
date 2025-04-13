import { useEffect, useRef } from 'react'
import './App.css'
import socket from '../utils/socket'

function App() {
 const canvasRef = useRef<HTMLCanvasElement>(null)
 

 useEffect(() => {
  const canvas = canvasRef.current
  if(!canvas) return 
 })

  return (
    <>
    <div>
    Collaborative Whiteboard
    </div>
    </>
  )
}

export default App
