process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const cors = require("cors");
const logger = require("morgan");
require("dotenv").config();

// mod.cjs
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const users = [];
const port = process.env.PORT || 3001;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000/:id");
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000/room/:id");

  next();
});

const API_KEY = process.env.daily_API_KEY;

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: "Bearer " + API_KEY,
};

app.get("/", (req, res) => {
  res.send("Hello World!");
  getRooms(req, res);
});

// get all rooms
app.get("/rooms", (req, res) => {
  getRooms(req, res);
});

const getRoom = (room) => {
  return fetch(`https://api.daily.co/v1/rooms/${room}`, {
    method: "GET",
    headers,
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((err) => console.error("error:" + err));
};

// get all rooms
const getRooms = (req, res) => {
  fetch("https://api.daily.co/v1/rooms", {
    method: "GET",
    headers,
  })
    .then((res) => res.json())
    .then((json) => {
      res.send(json);
    })
    .catch((err) => console.error("error:" + err));
};

// create a room
const createRoom = (room) => {
  return fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: room,
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: true,
        start_audio_off: false,
        lang: "en",
      },
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((err) => console.log("error:" + err));
};

app.get("/room/:id", async function (req, res) {
  console.log("req", req);
  const roomId = req.params.id;

  const room = await getRoom(roomId);
  if (room.error) {
    const newRoom = await createRoom(roomId);
    res.status(200).send(newRoom);
  } else {
    res.status(200).send(room);
  }
});

// const addUser = (userName, roomID) => {
//   // !users.some((user) => user.userId === userId) &&
//   //   users.push({ userId, roomId });

//   users.push({ userName, roomID });
// };

// const userLeave = (userName) => {
//   //users = users.filter((user) => user.userName !== userName);
//   const index = users.findIndex((user) => user.userName === userName);
//   if (index !== -1) {
//     return users.splice(index, 1)[0];
//   }
// };

// const getRoomUsers = (roomID) => {
//   return users.filter((user) => user.roomID === roomID);
// };

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("join-room", ({ roomId, userName }) => {
//     console.log("user joined-room");
//     console.log(roomId, userName);
//     socket.join(roomId);
//     addUser(userName, roomId);
//     socket.to(roomId).emit("user-connected", userName);

//     io.to(roomId).emit("room-users", getRoomUsers(roomId));

//     socket.on("disconnect", () => {
//       console.log("user disconnected");
//       userLeave(userName);
//       socket.to(roomId).emit("user-disconnected", userName);
//       io.to(roomId).emit("room-users", getRoomUsers(roomId));
//     });
//   });
// });

server.listen(port, () => {
  console.log(`api listening at http://localhost:${port}`);
});

module.exports = app;
