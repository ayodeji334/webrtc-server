const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const cors = require('cors');
const users = [];
const classrooms = [];
const usersInClassrooms = [];

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

// socket connection
io.on('connection', (socket) => {
    socket.on('join-class', (data) => {
        const { classID, username, uid } = data;
        const user = users.filter(user => user.uid === uid);
        const classroom = classrooms.filter(classroom => classroom.id === classID);
        const usersInClassroom = usersInClassrooms.filter(user => user.uid === uid && classID)
            
        // check if the class exist
        if(classroom.length > 0){
            if(user.length === 0) {
                // save user data
                users.push({uid, username});
            }

            if(usersInClassroom.length === 0){
                usersInClassrooms.push({ uid, classID });
            }
        }else{
            // error message
            socket.emit('class-does-not-exist', `class with id: ${classID} does not exist`);
        }

        // const classArr = classrooms.filter((classObj) => classObj.id === data.classID);
        // const usersInTheClassroom = users.filter(user => user.joinedClassID === data.classID);

        // socket.emit('all-users', usersInTheClassroom);
    });

    socket.on('start-class', (data) => {
        // check if the classID and user already exist
        const classArr = classrooms.filter((classObj) => classObj.id === data.classID);
        const userArr = users.filter(user => user.uid === data.uid);
        const { classTitle, classID, uid } = data;

        if(classArr.length > 0){ 
            socket.emit('class-already-created', classArr[0]);
        }else{
            classrooms.push({ classTitle, classID, hostID: uid});
        }

        if(userArr.length === 0){
            users.push({...data});
        }

        socket.emit('class-created', { success: true});

        // broadcast a message to the class
        io.to(data.classID).emit('class-started', data);

        // console.log('classes: ', classrooms)
        // console.log('users: ', users)

        // // sending the host signal to the class
        // socket.to(data.classID).emit('signal', {signal: data.signalData, host: data.hostID, hostname: data.hostName});
    });

    socket.on('enter-classroom', (id) => {
        const { classID, username, uid } = data;
        const user = users.filter(user => user.uid === uid);
        const classroom = classrooms.filter(classroom => classroom.id === classID);
        const usersInTheClassroom = users.filter(user => user.joinedClassID === data.classID);
            
        // check if the class exist
        if(classroom.length > 0){
            if(user.length === 0) {
                // save user data
                users.push({uid, username});
            }

            socket.emit('all-users', usersInTheClassroom);
        }else{
            // error message
            socket.emit('class-does-not-exist', `class with id: ${data.classID} does not exist`);
        }
    });

    socket.on('sending-signal', (data) => {
        io.to(data.classID).emit('joined-user-signal', data);
    });

    socket.on('returning-signal', (data) => {
        io.to(data.uid).emit('receiving-returned-user-signal', data);
    });

    socket.on('get-current-user', (id) => {
        const userArr = users.filter(user => user.uid === id);

        if(userArr.length > 0) {
            socket.emit('user-detail', userArr[0]);
        }else{
            socket.emit('user-not-found', `user account with ID: ${id} not found`);
        }
    });

    socket.on('get-class-detail', (id) => {
        const classroom = classrooms.filter(classroom => classroom.classID === id);

        if(classroom.length > 0) {
            socket.emit('classroom-detail', { ...classroom });
        }else{
            socket.emit('class-not-found', { isFound: false});
        }
    })
})

server.listen(9000);