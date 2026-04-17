const net = require("net");

const clients = new Map();

const server = net.createServer((socket) => {
    console.log("Кто-то подключился");

    socket.on("data", (data) => {
        const msg = data.toString().trim();
        console.log(msg);
    });
});

server.listen(4000);