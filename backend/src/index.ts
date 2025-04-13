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
    console.log("New client connected:", socket.id);

    socket.on('joinRoom', (roomId:string) => {
        socket.join(roomId);
        if(!rooms.has(roomId)) {
            rooms.set(roomId, {elements : []})
        }
        socket.emit('roomData',rooms.get(roomId))
    })

    socket.on('updateDrawing', (data:{roomId:string, elements:any[]})=> {
        if(rooms.has(data.roomId)) {
            rooms.set(data.roomId, {elements : data.elements})
            socket.to(data.roomId).emit('drawingUpdated', data.elements)
        }
    });

    socket.on('disconnect', () => {
        console.log('Clinet disconnected' , socket.id)
    })
})


server.listen(3001, () => {
    console.log('websocket server running on port 3001')
})
