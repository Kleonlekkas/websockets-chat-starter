const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html > memory
// __dirname in node = current directory
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.01: ${port}`);

// Pass in the http server into socketio and grab websocket server as io
const io = socketio(app);

// object to hold connected users
const users = {};

// var to hold generic name changes
let armyCount = 0;

const onJoined = (sock) => {
  const socket = sock;

  // broadcast - everyone   emit- individual  io.sockets.in - everyone including self

  socket.on('join', (data) => {
    // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    users[socket.name] = socket.name;

    // personalize the online status a bit
    /* if (Object.keys(users).length == 2) {
      joinMsg.msg = 'There is only one other person online. What a coincidence.';
    } */

    socket.emit('msg', joinMsg);


    socket.join('room1');

    // announcement to everyone in room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    // sucess message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    if (data.msg === '/eat') {
      io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} is trying to be funny by consuming laundry detergent.` });
    } else if (data.msg === '/learned') {
      io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} finally learned not to procrastinate things because it does not always work out, so at least some good came out of this situation.` });
    } else if (data.msg === '/meme') {
      io.sockets.in('room1').emit('msg', {
        name: 'server', msg: `
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░▄▄▄▄▄▄▄░░░░░░░░░
░░░░░░░░░▄▀▀▀░░░░░░░▀▄░░░░░░░
░░░░░░░▄▀░░░░░░░░░░░░▀▄░░░░░░
░░░░░░▄▀░░░░░░░░░░▄▀▀▄▀▄░░░░░
░░░░▄▀░░░░░░░░░░▄▀░░██▄▀▄░░░░
░░░▄▀░░▄▀▀▀▄░░░░█░░░▀▀░█▀▄░░░
░░░█░░█▄▄░░░█░░░▀▄░░░░░▐░█░░░
░░▐▌░░█▀▀░░▄▀░░░░░▀▄▄▄▄▀░░█░░
░░▐▌░░█░░░▄▀░░░░░░░░░░░░░░█░░
░░▐▌░░░▀▀▀░░░░░░░░░░░░░░░░▐▌░
░░▐▌░░░░░░░░░░░░░░░▄░░░░░░▐▌░
░░▐▌░░░░░░░░░▄░░░░░█░░░░░░▐▌░
░░░█░░░░░░░░░▀█▄░░▄█░░░░░░▐▌░
░░░▐▌░░░░░░░░░░▀▀▀▀░░░░░░░▐▌░
░░░░█░░░░░░░░░░░░░░░░░░░░░█░░
░░░░▐▌▀▄░░░░░░░░░░░░░░░░░▐▌░░
░░░░░█░░▀░░░░░░░░░░░░░░░░▀░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
`,
      });
    } else if (data.msg === '/newname') { // CHANGE NAME OF USER
      armyCount++;
      const newName = `AnonArmyMember ${armyCount}`;
      users[socket.name] = newName;
      io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} changed their name to ${newName}.` });
      socket.name = newName;
    } else if (data.msg === '/die') {
      const ranNum = Math.floor(Math.random() * Math.floor(6)) + 1;

      io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} rolled a ${ranNum} on a 6 sided die.` });
    } else {
      io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    const exitMessage = `${socket.name} has left the room.`;
    socket.broadcast.to('room1').emit('msg', { name: 'server', msg: exitMessage });
  });

  socket.leave('room1');
  delete users[socket.name];
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');

