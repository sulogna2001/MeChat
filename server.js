const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const formatMessage = require('./utils/messages');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');


const PORT = process.env.PORT || 3000;
const botName = 'ChatCord Bot';

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', (socket) => {
    // console.log('New connection......');
    socket.on('joinRoom', ({
        username,
        room
    }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to chat cord!')); //message to only single user 

        //Brodcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`)); //message to all user except the client

        //sends user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
          });

    });



    //Listen for chat message
    socket.on('chatMessage', (msg) => {
        // console.log(msg);
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));

    });
    //Runs when client disconnects
    socket.on('disconnect', () => {
        io.emit('message', formatMessage(botName, 'A user has left the chat!')); 
        //message to all user 
        const user=userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botName , `${user.username} has left the chat`));
        }
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
          });
    });

});

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
})





