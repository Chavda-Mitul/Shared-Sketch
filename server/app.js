const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = socketIO(server, {
  cors: {
    origin: ["*", "http://localhost:5173"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("drawing", (lines, roomId) => {
    // console.log(lines);
    // if (roomId === "") io.emit("drawing", lines);
    if (roomId != "") socket.to(roomId).emit("drawing", lines);
  });

  socket.on("joinRoom", (roomid) => {
    socket.join(roomid);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const port = 3000;
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
