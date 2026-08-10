const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
    },
  });

  const rooms = new Map();

  io.on("connection", (socket) => {
    socket.on("join-room", ({ taskId, user }) => {
      socket.join(taskId);
      socket.data.taskId = taskId;
      socket.data.user = user;

      if (!rooms.has(taskId)) {
        rooms.set(taskId, new Map());
      }
      rooms.get(taskId).set(socket.id, user);

      io.to(taskId).emit(
        "room-users",
        Array.from(rooms.get(taskId).values())
      );
    });

    socket.on("file-change", ({ taskId, path, content }) => {
      socket.to(taskId).emit("file-update", { path, content });
    });

    socket.on("disconnect", () => {
      const taskId = socket.data.taskId;
      if (taskId && rooms.has(taskId)) {
        rooms.get(taskId).delete(socket.id);
        if (rooms.get(taskId).size === 0) {
          rooms.delete(taskId);
        } else {
          io.to(taskId).emit(
            "room-users",
            Array.from(rooms.get(taskId).values())
          );
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});