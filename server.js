const net = require("net");

const clients = new Map();

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

    if (clients.has(userName)) {
        clients.delete(userName);
        console.log(`Клиент ${userName} отключился по причине: ${err ? err : "Конец соединения"}`)
    }
}

server.listen(4000, () => {
    console.log("Сервер запущен на 4000 порту");
});