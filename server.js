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
                            players: [],
                            spectators: [],
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

                    case "JOIN_ROOM": {
                        const { id, mode } = message.payload;

                        const room = rooms.get(id);
                        if (!room) return;

                        if (mode === "PLAYER") {
                            if (room.players.length >= 2) {
                                socket.write(JSON.stringify({
                                    type: "JOIN_REJECT",
                                    reason: "Данная комната переполнена",
                                    target: socket.userName
                                }) + "\n");
                                return;
                            }
                            room.players.push(socket.userName);
                        } else {
                            room.spectators.push(socket.userName);
                        }

                        socket.write(JSON.stringify({
                            type: "JOIN_SUCCESS",
                            payload: {
                                id
                            }
                        }) + "\n");                 

                        broadcast({
                            type: "ROOM_UPDATED",
                            payload: {
                                room
                            }
                        });

                        console.log(`Игрок ${socket.userName} присоединился к ${room.title}`);

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

        // удалить из игроков
        const playerIndex = room.players.indexOf(userName);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
        }

        // удалить из наблюдателей
        const spectatorIndex = room.spectators.indexOf(userName);
        if (spectatorIndex !== -1) {
            room.spectators.splice(spectatorIndex, 1);
        }

        if (playerIndex !== -1 || spectatorIndex !== -1) {
            broadcast({
                type: "ROOM_UPDATED",
                payload: {
                    room
                }
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