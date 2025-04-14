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
    console.log("New client connected:", socket.id);
    socket.on('ping', (timestamp) => {
        socket.emit('pong', timestamp);
    });
    socket.on('joinRoom', (roomId) => {
        var _a;
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { elements: [] });
        }
        socket.emit('roomData', rooms.get(roomId));
        const users = ((_a = io.sockets.adapter.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        io.to(roomId).emit('userCount', users + 1);
    });
    socket.on('updateDrawing', (data) => {
        if (rooms.has(data.roomId)) {
            rooms.set(data.roomId, { elements: data.elements });
            socket.to(data.roomId).emit('drawingUpdated', data.elements);
        }
    });
    socket.on('disconnect', () => {
        console.log('Clinet disconnected', socket.id);
    });
});
server.listen(3001, () => {
    console.log('websocket server running on port 3001');
});
