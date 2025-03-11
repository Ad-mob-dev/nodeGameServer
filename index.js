var express = require("express");
var http = require("http");
var socketIO = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketIO(server, {
  transports: ["websocket"],
  allowEIO3: true // Use this if you face any issues with Socket.IO version compatibility
});

var enemies = [];
var playerSpawnPoints = [];
var clients = [];
var Rooms = [];

app.get("/", function (req, res) {
  res.send("this is home of server");
});

io.on("connection", function (socket) {
  console.log("A client connected: " + socket.id);
  var currentPlayer = {};

  socket.on("error", function (err) {
    console.error("Socket error: ", err);
  });

  socket.on("player connect", function (data) {
    console.log("player Connect data  : " + JSON.stringify(data));

    var playerConnected = {
      name: data.name,
      position: data.playerSpawnPoint.position,
      rotation: data.playerSpawnPoint.rotation,
      health: data.health,
      socket: socket.id,
    };

    clients.push(playerConnected);
    console.log("emitting to client back");
    socket.emit("player connected", playerConnected);
  });

  // Handle creating a room
  socket.on("create room", (data) => {
    console.log("recv: create room: " + JSON.stringify(data));

    if (Rooms.some((room) => room.roomName === data.roomName)) {
      socket.emit("warning", `Room ${data.roomName} already exists.`);
      return;
    }

    const room = {
      roomName: data.roomName,
      roomOwner: data.roomOwner,
      roomUser : data.roomUser,
      userLimit: data.userLimit,
      joinedUser: 1,
      users: [],
    };
    Rooms.push(room);
    socket.join(data.roomName);
    socket.emit("room created", room);
  });

  // Handle joining a room
  socket.on("join room", (data) => {
    console.log(`User ${socket.id} recv: join room: ${JSON.stringify(data)}`);

    const room = Rooms.find((room) => room.roomName === data.roomName);
    console.log(room);
    if (!room) {
      socket.emit("warning", `Room ${data.roomName} not found.`);
      return;
    }

    if (room.joinedUser >= room.userLimit) {
      socket.emit("warning", `Room ${data.roomName} is full.`);
      return;
    }

    socket.join(data.roomName);
    room.joinedUser += 1;
    room.users.push({ userId: socket.id, userName: data.roomUser });

    socket.emit("room joined", room);

    // Notify others in the room about the new player
    socket
      .to(data.roomName)
      .emit("new player in room", { userName: data.roomUser });
  });

  socket.on("leave room", (data) => {
    const room = Rooms.find((room) => room.name === data.name);
    if (room) {
      socket.leave(data.name);
      room.joinedUser -= 1;
      room.users = room.users.filter((user) => user.userId !== socket.id);

      if (room.joinedUser === 0) {
        Rooms = Rooms.filter((r) => r.name !== data.name);
        console.log(`Room ${data.name} deleted because it is empty`);
      }
    }
    console.log(`User ${socket.id} left room ${data.name}`);
  });

  socket.on("play", function (data) {
    console.log(currentPlayer.name + " recv: play: " + JSON.stringify(data));

    if (clients.length === 0) {
      playerSpawnPoints = [];
      data.playerSpawnPoints.forEach(function (_playerSpawnPoint) {
        var playerSpawnPoint = {
          position: _playerSpawnPoint.position, // Changed from 'positon' to 'position'
          rotation: _playerSpawnPoint.rotation,
        };
        playerSpawnPoints.push(playerSpawnPoint);
      });
    }

    var randomSpawnPoint =
      playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)];
    currentPlayer = {
      name: data.name,
      position: randomSpawnPoint.position,
      rotation: randomSpawnPoint.rotation,
      health: 100,
    };

    clients.push(currentPlayer);
    console.log(
      currentPlayer.name + " emit: play: " + JSON.stringify(currentPlayer)
    );
    socket.emit("play", currentPlayer);
    socket.broadcast.emit("other player connected", currentPlayer);
  });

  socket.on("player move", function (data) {
    console.log("rec : move: ", JSON.stringify(data));
    currentPlayer.position = data.position;
    socket.broadcast.emit("player move", currentPlayer);
  });

  socket.on("player turn", function (data) {
    console.log("rec : turn: ", JSON.stringify(data));
    currentPlayer.rotation = data.rotation;
    socket.broadcast.emit("player turn", currentPlayer);
  });

  socket.on("player shoot", function () {
    console.log(currentPlayer.name + " rec : shoot:");
    var data = {
      name: currentPlayer.name,
    };
    console.log(currentPlayer.name + " bcst : shoot: " + JSON.stringify(data));
    socket.emit("player shoot", data);
    socket.broadcast.emit("player shoot", data);
  });

  socket.on("health", function (data) {
    console.log(currentPlayer.name + " rec : health:" + JSON.stringify(data));
    if (data.from === currentPlayer.name) {
      var indexDamaged = 0;

      if (!data.isEnemy) {
        clients = clients.map((client, index) => {
          if (client.name === data.name) {
            indexDamaged = index;
            client.health -= data.healthChange;
          }
          return client;
        });
      } else {
        enemies = enemies.map((enemy, index) => {
          if (enemy.name === data.name) {
            indexDamaged = index;
            enemy.health -= data.healthChange;
          }
          return enemy;
        });
      }

      var response = {
        name: !data.isEnemy
          ? clients[indexDamaged].name
          : enemies[indexDamaged].name,
        health: !data.isEnemy
          ? clients[indexDamaged].health
          : enemies[indexDamaged].health,
      };

      console.log(
        currentPlayer.name + " bcst : health: " + JSON.stringify(response)
      );
      socket.emit("health", response);
      socket.broadcast.emit("health", response);
    }
  });

  socket.on("disconnect", function () {
    console.log(currentPlayer.name + " recv: disconnect " + currentPlayer.name);
    socket.broadcast.emit("other player disconnected", currentPlayer);
    console.log(
      currentPlayer.name +
        " bcst : other player disconnected " +
        JSON.stringify(currentPlayer)
    );
    for (let index = 0; index < clients.length; index++) {
      if (clients[index].name === currentPlayer.name) {
        clients.splice(index, 1);
        break;
      }
    }
  });

  socket.on("message", function (data) {
    console.log(data);
  });
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

server.listen(3000, function() {
  console.log("Server is running on port 3000");
});
