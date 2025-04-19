"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, cors_1.default)());
app.use(body_parser_1.default.urlencoded());
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const rooms = new Map();
io.on('connection', (socket) => {
    const cursorThrottle = 30;
    let lastSent = 0;
    console.log("New client connected:", socket.id);
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { elements: [] });
        }
        socket.emit('roomData', rooms.get(roomId));
    });
    socket.on('updateDrawing', (data) => {
        if (rooms.has(data.roomId) && socket.rooms.has(data.roomId)) {
            rooms.set(data.roomId, { elements: data.elements });
            socket.to(data.roomId).emit('drawingUpdated', data.elements);
        }
    });
    const activeCursors = new Map();
    socket.on('cursorMove', (data) => {
        const now = Date.now();
        if (now - lastSent < cursorThrottle)
            return;
        lastSent = now;
        if (!data.roomId || !data.position)
            return;
        if (typeof data.position.x !== 'number' ||
            typeof data.position.y !== 'number')
            return;
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
    });
    const activeUsers = new Map();
    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        activeCursors.delete(socket.id);
        activeUsers.delete(socket.id);
        socket.broadcast.emit('userDisconnected', socket.id);
    });
    socket.on('presence', (roomId) => {
        activeUsers.set(socket.id, {
            roomId,
            lastActive: Date.now()
        });
    });
});
server.listen(3001, () => {
    console.log('websocket server running on port 3001');
});
