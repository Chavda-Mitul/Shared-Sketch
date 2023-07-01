const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const { log } = require("console");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = socketIO(server, {
  cors: {
    origin: [
      "*",
      "https://wondrous-kelpie-b05aa8.netlify.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});
app.get("/", (req, res) => res.send("server runnning"));

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("drawing", (lines, roomId) => {
    // console.log(lines);
    // if (roomId === "") io.emit("drawing", lines);
    if (roomId !== "") socket.to(roomId).emit("drawing", lines);
  });

  socket.on("joinRoom", (roomid) => {
    socket.join(roomid);
  });

  socket.on("clear", (lines, roomId) => {
    lines = [];
    if (roomId == "") socket.emit("drawing", []);
    else {
      socket.to(roomId).emit("drawing", []);
      socket.emit("drawing", []);
    }
  });
  socket.on("iceCandidate", (candidate, roomId) => {
    console.log("c", candidate);
    socket.broadcast.to(roomId).emit("iceCandidate", candidate);
  });

  socket.on("call", (offer, roomId) => {
    console.log(offer);
    socket.broadcast.to(roomId).emit("call", offer);
  });

  socket.on("answer", (answer, roomId) => {
    socket.broadcast.to(roomId).emit("answer", answer);
    console.log(answer);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
/**
 * to do
 * user should able to create a room
 * user can clean in one button
 * user should able to edit image
 * - should add image
 */
