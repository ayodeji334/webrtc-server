const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const cors = require('cors');

const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: false,
        methods: ['GET', 'POST']
    },
});

app.use(cors({
    origin : '*',
}))

app.get('/', (req, res) => {
    res.send("<h1>Welcome</h1>")
})

// start class endpoint
app.get('/start-class', (req, res) => {
    // console.log(req);  
    res.send('<h1>Welcome to Start Classroom endpoint</h1>')
});

// socket connection
io.on('connection', (socket) => {
    socket.on('join-class', (data) => {
        console.log("this is the user Id: ", data.userID)
        io.to(data.classID).emit('class-announcement', data);
        // join the user to the class
        socket.join(data.classID);
        // broadcast the message to all conected users
        socket.to(data.classID).emit('user-joined', { userID: data.userID, username: data.userName});
        // join the new user to the class stream
        // socket.to(data.classID).emit('join-class-stream', {signal: data.signalData, userID: data.userID, username: data.userName});
        io.to(data.classID).emit('signal', {signal: data.signalData, userID: data.userID, username: data.userName});
    });

    socket.on('start-class', (data) => {
        console.log('class id with signal data', data.classID);
        // broadcast a message to the class
        io.to(data.classID).emit('class-announcement', data);
        // sending the host signal to the class
        io.sockets.in(data.classID).emit('signal', {signal: data.signalData, host: data.hostID, hostname: data.hostName});
    });
})

server.listen(9000);