const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Handle a new connection
io.on('connection', (socket) => {
    console.log('a user connected');

    // Handle user joining a room
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        // Welcome the current user
        socket.emit('message', { user: 'admin', text: `${username}, welcome to room ${room}` });

        // Broadcast to other users in the room
        socket.broadcast.to(room).emit('message', { user: 'admin', text: `${username} has joined the chat` });

        // Send room info
        io.to(room).emit('roomData', {
            room: room,
            users: getUsersInRoom(room)
        });
    });

    // Handle user sending a message
    socket.on('chatMessage', (msg) => {
        io.to(socket.room).emit('message', { user: socket.username, text: msg });
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        if (socket.username && socket.room) {
            io.to(socket.room).emit('message', { user: 'admin', text: `${socket.username} has left the chat` });

            // Send room info
            io.to(socket.room).emit('roomData', {
                room: socket.room,
                users: getUsersInRoom(socket.room)
            });
        }
        console.log('user disconnected');
    });
});

function getUsersInRoom(room) {
    const users = [];
    const clients = io.sockets.adapter.rooms.get(room);

    if (clients) {
        clients.forEach((clientId) => {
            const clientSocket = io.sockets.sockets.get(clientId);
            users.push(clientSocket.username);
        });
    }
    return users;
}


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
