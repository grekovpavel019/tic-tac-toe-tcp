const net = require("net");

const clients = new Map();

const server = net.createServer((socket) => {
    console.log("Кто-то подключился");

    let buffer = '';
    socket.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");

        buffer = messages.pop();

        messages.forEach(msg => {
            if (!msg.trim()) return;

            const message = JSON.parse(msg);

            switch (message.type) {
                case "CONNECT": {
                    console.log("Подключился вот этот пидорас: " + socket.remotePort);

                    if (clients.has(message.userName)) {

                        socket.write(JSON.stringify({
                            type: "LOGIN_ERROR",
                            reason: "Такое имя уже занято"
                        }) + "\n")
                        return;
                    }

                    socket.write(JSON.stringify({
                        type: "LOGIN_SUCCESS"
                    }) + "\n");

                    clients.set(message.userName, {
                        address: socket.remotePort
                    });

                    break;
                }
            }
        })

    })
});

server.listen(4000, () => {
    console.log("Сервер запущен на 4000 порту");
});