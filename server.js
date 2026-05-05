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
                        const userName = message.userName?.trim();
                        if (!userName) return;

                        if (clients.has(userName)) {
    
                            socket.write(JSON.stringify({
                                type: "LOGIN_ERROR",
                                reason: "Такое имя уже занято"
                            }) + "\n")
                            return;
                        }
    
                        console.log(`Клиент ${socket.remotePort} присоединился под зарегестрировался под именем ${userName}`);
    
                        socket.write(JSON.stringify({
                            type: "LOGIN_SUCCESS"
                        }) + "\n");
    
                        socket.userName = userName;
                        clients.set(userName, socket);
                        break;
                    }
    
                    case "DISCONNECT": {
                        socket.end();
                        break;
                    }

                    case "CREATE_ROOM": {
                        const { title } = message.payload;
                        if (!title) return;

                        const id = ++roomID;

                        const room =  {
                            id,
                            title,
                            owner: socket.userName,
                            players: [],
                            spectators: [],
                            status: "WAITING",

                            ready: [],
                            board: Array(9).fill(0),

                            symbols: {},
                            turn: null
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

                        const room = rooms.get(Number(id));
                        if (!room) return;

                        room.players = room.players.filter(u => u !== socket.userName);
                        room.spectators = room.spectators.filter(u => u !== socket.userName);

                        if (mode === "PLAYER") {
                            if (room.players.length >= 2) {
                                socket.write(JSON.stringify({
                                    type: "JOIN_REJECT",
                                    reason: "Данная комната переполнена",
                                    target: socket.userName
                                }) + "\n");
                                return;
                            }
                            if (!room.players.includes(socket.userName)) {
                                room.players.push(socket.userName);
                            }
                        } else {
                            if (!room.spectators.includes(socket.userName)) {
                                room.spectators.push(socket.userName);
                            }
                        }

                        socket.write(JSON.stringify({
                            type: "JOIN_SUCCESS",
                            payload: {
                                id,
                                mode,
                                ready: room.ready,
                                board: room.board,
                                status: room.status,
                                turn: room.turn,
                                symbols: room.status === "PLAYING" ? room.symbols : null
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

                    case "LEAVE_ROOM": {
                        const { id } = message.payload;
                        const room = rooms.get(Number(id));

                        if (!room) return;

                        const userName = socket.userName;
                        let leavedSuccess = false;

                        const playerIndex = room.players.indexOf(userName);
                        if (playerIndex !== -1) {
                            room.players.splice(playerIndex, 1);
                            leavedSuccess = true;
                        }

                        const spectatorIndex = room.spectators.indexOf(userName);
                        if (spectatorIndex !== -1) {
                            room.spectators.splice(spectatorIndex, 1);
                            leavedSuccess = true;
                        }

                        const readyIndex = room.ready.indexOf(userName);
                        if (readyIndex !== -1) {
                            room.ready.splice(readyIndex, 1);
                        }

                        if (leavedSuccess) {
                            socket.write(JSON.stringify({
                                type: "LEAVE_SUCCESS",
                                payload: {
                                    id
                                }
                            }) + "\n");
                        }

                        if (room.owner === userName) {
                            rooms.delete(id);

                            broadcast({
                                type: "ROOM_DELETED",
                                payload: { id }
                            });

                            return;
                        }

                        broadcast({
                            type: "ROOM_UPDATED",
                            payload: {
                                room
                            }
                        });

                        break;
                    }

                    case "MESSAGE_SEND": {
                        const { text, id } = message.payload;
                        const room = rooms.get(Number(id));

                        if (!room) return;

                        const userMode = getUserMode(room, socket.userName);
                        if (!userMode) return;

                        const msg = {
                            type: "MESSAGE",
                            payload: {
                                user: socket.userName,
                                text,
                                roomId: id,
                                mode: userMode
                            }
                        }

                        const recipients = new Set(room.spectators);

                        if (userMode === "PLAYER") {
                            room.players.forEach(p => recipients.add(p));
                        }

                        for (const name of recipients) {
                            const client = clients.get(name);
                            if (client) {
                                client.write(JSON.stringify(msg) + "\n");
                            }
                        }

                        break;
                    }

                    case "READY": {
                        const { id } = message.payload;
                        console.log(id);
                        const room = rooms.get(Number(id));
                        if (!room) return;

                        if (room.status !== "WAITING") return;

                        if (!room.players.includes(socket.userName)) return;

                        if (!room.ready.includes(socket.userName)) {
                            room.ready.push(socket.userName);
                        }
                        
                        console.log('фф')

                        if (room.ready.length !== 2) {
                            broadcastToRoom(room, {
                                type: "ROOM_UPDATED",
                                payload: {
                                    room
                                }
                            });

                            return;
                        }
                        room.ready = [];
                        room.status = "PLAYING";

                        startGame(room);

                        broadcastToRoom(room, {
                            type: "ROOM_UPDATED",
                            payload: {
                                room
                            }
                        });

                        broadcast({
                            type: "ROOM_STATUS_UPDATED",
                            payload: {
                                room
                            }
                        });

                        break;
                    }

                    case "MAKE_MOVE": {
                        const { roomId, index } = message.payload;
                        const room = rooms.get(Number(roomId));

                        if (!room) return;

                        const user = socket.userName;
                        if (room.status !== "PLAYING") return;
                        if (room.turn !== user) return;
                        if (room.board[index] !== 0) return;

                        const symbol = room.symbols[user];

                        room.board[index] = symbol;

                        const winner = checkWinner(room.board);

                        if (winner) {
                            room.status = "FINISHED";

                            broadcastToRoom(room, {
                                type: "GAME_FINISHED",
                                payload: {
                                    winner,
                                    board: room.board
                                }
                            });

                            // 💥 удалить комнату после короткой задержки
                            setTimeout(() => {
                                rooms.delete(room.id);

                                broadcast({
                                    type: "ROOM_DELETED",
                                    payload: { id: room.id }
                                });
                            }, 2000);

                            return;
                        }

                        if (isDraw(room.board)) {
                            room.status = "FINISHED";

                            broadcastToRoom(room, {
                                type: "GAME_FINISHED",
                                payload: {
                                    winner: null,
                                    board: room.board
                                }
                            });

                            setTimeout(() => {
                                rooms.delete(room.id);

                                broadcast({
                                    type: "ROOM_DELETED",
                                    payload: { id: room.id }
                                });
                            }, 2000);

                            return;
                        }

                        // смена хода
                        const [p1, p2] = room.players;
                        room.turn = room.turn === p1 ? p2 : p1;

                        broadcastToRoom(room, {
                            type: "GAME_UPDATE",
                            payload: {
                                board: room.board,
                                turn: room.turn,
                                status: room.status
                            }
                        });

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

const WIN_LINES = [
    [0,1,2],
    [3,4,5],
    [6,7,8],

    [0,3,6],
    [1,4,7],
    [2,5,8],

    [0,4,8],
    [2,4,6]
];

function checkWinner(board) {
    for (const line of WIN_LINES) {
        const [a, b, c] = line;

        if (
            board[a] !== 0 &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a]; // "X" или "O"
        }
    }

    return null;
}

function isDraw(board) {
    return board.every(cell => cell !== 0);
}

function startGame(room) {
    const [p1, p2] = room.players;

    if (Math.random() > 0.5) {
        room.symbols[p1] = "X"
        room.symbols[p2] = "O"
        room.turn = p1
    } else {
        room.symbols[p1] = "O"
        room.symbols[p2] = "X"
        room.turn = p2;
    }


    for (const player of [...room.players]) {
        const client = clients.get(player);
        if (!client) continue;

        client.write(JSON.stringify({
            type: "ROLE_DELIVERY",
            payload: {
                symbol: room.symbols[player],
                isYourTurn: room.turn === player
            }
        }) + "\n");
    }
    
    broadcastToRoom(room, {
        type: "GAME_START",
        payload: {
            roomID: room.id,
            board: room.board
        }
    });
}

function broadcastToRoomPlayers(room, msg) {
    const data = JSON.stringify(msg) + "\n";

    for (const name of [...room.players]) {
        const client = clients.get(name);
        if (!client) continue;

        client.write(data);
    }
}

function broadcastToRoom(room, msg) {
    const data = JSON.stringify(msg) + "\n";

    for (const name of [...room.players, ...room.spectators]) {
        const client = clients.get(name);
        if (!client) continue;

        client.write(data);
    }   
}

function getUserMode(room, userName) {
    if (room.players.includes(userName)) return "PLAYER";
    if (room.spectators.includes(userName)) return "SPECTATOR";
    return;
}

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

        const readyIndex = room.ready.indexOf(userName);
        if (readyIndex !== -1) {
            room.ready.splice(readyIndex, 1);
        }

        if (playerIndex !== -1 || spectatorIndex !== -1) {
            broadcastToRoom(room, {
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