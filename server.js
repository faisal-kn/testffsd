const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

userData = {};

app.use("/peerjs", peerServer);
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

io.on("connection", (socket) => {
  let roomIdtemp, userIdtemp;
  socket.on("join-room", (roomId, userId) => {
    let initiate = false;
    roomIdtemp = roomId;
    userIdtemp = userId;
    if (userData[roomId]) {
      if (userData[roomId].users.includes(userId)) {
      } else {
        userData[roomId].users.push({
          userId: userId,
          initiated: initiate,
        });
      }
    } else {
      userData[roomId] = {
        users: [
          {
            userId: userId,
            initiated: initiate,
          },
        ],
      };
    }
    socket.join(roomId);
    if (userData[roomId].users.length == 2) {
      userData[roomId].users[0].initiated = true;
      let users = userData[roomId].users;
      console.log({ userId, initiate, roomId, users });
      io.to(roomId).emit("user-connected", {
        users: users,
      });
    }
  });

  socket.on("offerToServer", ({ data, receiverId, senderId }) => {
    console.log(
      "Server: Sending " + data.type + " to " + receiverId + " " + Date.now()
    );
    socket.to(receiverId).emit("offerToClient", { data, senderId });
  });

  socket.on("ready-to-init", (userId) => {
    console.log("Ready to init");
    io.to(userId).emit("init-peer");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected", userData[roomIdtemp]?.users);
    if (userData[roomIdtemp]) {
      if (userData[roomIdtemp].users.length >= 2) {
        userData[roomIdtemp].users = [];
      }
    }
  });
});

server.listen(3000);
