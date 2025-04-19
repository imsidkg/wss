import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from 'body-parser'
import cors from 'cors'

const app = express();
const server = createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded())

const io = new Server(server , {
    cors :{
        origin: '*',
        methods: ['GET', 'POST']
    }
})

const rooms = new Map<string, any>();
io.on('connection', (socket) => {

    const cursorThrottle  = 30 
    let lastSent = 0
    console.log("New client connected:", socket.id);

    socket.on('joinRoom', (roomId:string) => {
        socket.join(roomId);
        if(!rooms.has(roomId)) {
            rooms.set(roomId, {elements : []})
        }
        socket.emit('roomData',rooms.get(roomId))
    })

    socket.on('updateDrawing', (data:{roomId:string, elements:any[]})=> {
        if(rooms.has(data.roomId) && socket.rooms.has(data.roomId)) {
            rooms.set(data.roomId, {elements : data.elements})
            socket.to(data.roomId).emit('drawingUpdated', data.elements)
        }
    });
    
    
        const activeCursors = new Map<string, {
            roomId: string;
            position: { x: number; y: number };
            lastUpdated: number;
          }>();
    socket.on('cursorMove' , (data) => {
        const now = Date.now();
    
        if (now - lastSent < cursorThrottle) return;
        lastSent = now;
    
        if (!data.roomId || !data.position) return;
        if (typeof data.position.x !== 'number' || 
            typeof data.position.y !== 'number') return;
    
        activeCursors.set(socket.id, {
          roomId: data.roomId,
          position: data.position,
          lastUpdated: now
        });
    
        socket.to(data.roomId).emit('userCursor', {
          userId: socket.id,
          position: data.position,
          timestamp: now
        });
    })


    const activeUsers = new Map<string, {
        roomId: string;
        lastActive: number;
    }>();

    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        activeCursors.delete(socket.id);
        activeUsers.delete(socket.id);
        socket.broadcast.emit('userDisconnected', socket.id);
    });

    socket.on('presence', (roomId: string) => {
        activeUsers.set(socket.id, {
            roomId,
            lastActive: Date.now()
        });
    });
})


server.listen(3001, () => {
    console.log('websocket server running on port 3001')
})
