const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let userCount = 1;
const users = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
    console.log('Nowy użytkownik połączony');
  
    socket.on('setUser', (user) => {
    user.money = Number(user.money);
    users[socket.id] = { ...user, id: socket.id };
    userCount++;
    io.emit('userCount', { count: userCount, users: Object.values(users) });
  });

  socket.on('transferNumber', ({ fromUser, toUserId, amount }) => {
    amount = Number(amount);
    if (users[socket.id] && users[toUserId]) {
      if (users[socket.id].money >= amount && amount >= 0) {
        console.log(`${users[socket.id].username}(${users[socket.id].money}) przelał dla ${users[toUserId].username}(${users[toUserId].money}) kwotę ${amount}`);
        users[socket.id].money -= amount;
        users[toUserId].money += amount;
        io.emit('userCount', { count: userCount, users: Object.values(users) });
      } else {
        socket.emit('error', 'Zbyt mała liczba pieniędzy lub przelew ujemny');
      }
    } else {
      socket.emit('error', 'Nieprawidłowy użytkownik');
    }
  });

  socket.on('updateMoney', (newMoney) => {
    if (users[socket.id]) {
        newMoney = Number(newMoney);
        if ((users[socket.id].money+newMoney)>=0) {
            console.log(`${users[socket.id].username} zmienił swoje konto o wartości(${users[socket.id].money}) o ${newMoney}`)
            users[socket.id].money += newMoney;  
            io.emit('userCount', { count: userCount, users: Object.values(users) });
        }
     else{
        socket.emit('error', 'Konto nie może być ujemne');
     }
    }
  });

  socket.on('disconnect', () => {
    console.log('Użytkownik rozłączony');
    delete users[socket.id];
    userCount--;
    io.emit('userCount', { count: userCount, users: Object.values(users) });
  });
});

app.post('/login', (req, res) => {
  const {username, money} = req.body;
  if (username && money) {
    console.log(req.body);
    console.log(users);
    res.redirect(`/game?username=${username}&money=${money}`);
  } else {
    res.redirect('/');
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get(`/game`,(req, res) => {
    res.sendFile(__dirname + '/game.html');
  });

server.listen(3000, () => {
  console.log('Serwer działa na porcie 3000');
});