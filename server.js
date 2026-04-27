const net = require("net");

const clients = new Map();
const rooms = new Map();
let roomID = 0;

const server = net.createServer((socket) => {

    socket.setNoDelay(true);
    
    let buffer = '';
    socket.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");
        buffer = messages.pop();

        messages.forEach(msg => {
            if (!msg.trim()) return;

            try {
                const message = JSON.parse(msg);
    
                switch (message.type) {
                    case "CONNECT": {
                        if (clients.has(message.userName)) {
    
                            socket.write(JSON.stringify({
                                type: "LOGIN_ERROR",
                                reason: "Такое имя уже занято"
                            }) + "\n")
                            return;
                        }
    
                        console.log(`Клиент ${socket.remotePort} присоединился под зарегестрировался под именем ${message.userName}`);
    
                        socket.write(JSON.stringify({
                            type: "LOGIN_SUCCESS"
                        }) + "\n");
    
                        socket.userName = message.userName;
                        clients.set(message.userName, socket);
                        break;
                    }
    
                    case "DISCONNECT": {
                        socket.end();
                        break;
                    }

                    case "CREATE_ROOM": {
                        const { title } = message.payload;

                        const id = ++roomID;

                        const room =  {
                            id,
                            title,
                            owner: socket.userName,
                            players: 1,
                            spectators: 0,
                            status: "WAITING"
                        };

                        rooms.set(id, room);

                        broadcast({
                            type: "ROOM_CREATED",
                            payload: {
                                room
                            }
                        });

                        break;
                    }

                    case "GET_ROOMS": {
                        socket.write(JSON.stringify({
                            type: "ROOMS_LIST",
                            rooms: [...rooms.values()]
                        }) + "\n");

                        break;
                    }
                }

            } catch (e) {
                console.log(e);
            }
        })
    });

    socket.on("close", () => { handleDisconnect(socket); });

    socket.on("end", () => { handleDisconnect(socket); });

    socket.on("error", (err) => { handleDisconnect(socket, err);} );
});

function handleDisconnect(socket, err) {
    const userName = socket.userName;

    if (!userName) return;

    for (const [id, room] of rooms) {
        if (room.owner === userName) {
            rooms.delete(id);

            broadcast({
                type: "ROOM_DELETED",
                payload: { id }
            });
        }
    }

    if (clients.has(userName)) {
        clients.delete(userName);
        console.log(`Клиент ${userName} отключился по причине: ${err ? err : "Конец соединения"}`)
    }
}

function broadcast(msg) {
    const data = JSON.stringify(msg) + "\n";

    for (const client of clients.values()) {
        client.write(data);
    }
}

server.listen(4000, () => {
    console.log("Сервер запущен на 4000 порту");
});