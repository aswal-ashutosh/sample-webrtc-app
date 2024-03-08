import { Server } from "socket.io";

const io = new Server(3000, { cors: { origin: "*" } });

const rooms: Set<string> = new Set();

io.on("connection", (socket) => {
    console.log(`Socket connected @${socket.id}.`);
    socket
        .on("create:room", () => {
            const roomId = Math.random().toString(36).substring(2, 9);
            rooms.add(roomId);
            socket.join(roomId);
            socket.emit("room:created", roomId);
        })
        .on("join:room", (roomId) => {
            if (rooms.has(roomId)) {
                socket.join(roomId);
                socket.emit("room:joined", roomId);
            } else {
                socket.emit("invalid:roomId", `${roomId} is not valid room id.`);
            }
        })
        .on("room:ready", (roomId) => {
            socket.to(roomId).emit("room:ready");
        })
        .on("create:offer", ({ roomId, offer }) => {
            socket.to(roomId).emit("offer", offer);
        })
        .on("send:answer", ({ roomId, answer }) => {
            socket.to(roomId).emit("answer", answer);
        })
        .on("connection:ready", (roomId) => {
            io.to(roomId).emit("init:sharing");
        })
        .on("create:negotiation:offer", ({ roomId, offer }) => {
            socket.to(roomId).emit("negotiation:offer", offer);
        })
        .on("send:negotiation:answer", ({ roomId, answer }) => {
            socket.to(roomId).emit("negotiation:answer", answer);
        })
        .on("negotiation:completed", (roomId) => {
            io.to(roomId).emit("negotiation:completion");
        });
});
