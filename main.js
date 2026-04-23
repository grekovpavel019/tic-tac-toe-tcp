const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");
const net = require("net");
const { create } = require('domain');

let client;
let mainWindow;

app.setPath("userData", "C:\\electron_test");

ipcMain.on("tcp-connect", (event, options) => {
    const { userName } = options;
    
    client = net.createConnection({
        host: "127.0.0.1",
        port: 4000
    });

    client.setNoDelay(true);
    
    client.on("connect", () => {
        const message = JSON.stringify({
            type: "CONNECT",
            userName
        });

        client.write(message + "\n");
    });
    
    let buffer = "";
    client.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");
        buffer = messages.pop();
        
        messages.forEach((msg) => {
            if (!msg.trim()) return;
            
            try {
                const message = JSON.parse(msg);
                mainWindow.webContents.send("tcp-message", message);
            } catch (e) {
                console.log("Bad JSON: ", msg)
            }
            
        });
    });
    
    client.on("close", () => { 
        console.log("Соединение закрыто")
        client = null;
        console.log(client);
    });

    client.on("error", (err) => { console.log(`Клиент отключился по причине: ${err}`); });

}); 

ipcMain.on("tcp-send", (event, msg) => {
    if (!client) return;

    client.write(JSON.stringify(msg) + "\n");
});

ipcMain.on("tcp-disconnect", (event) => {
    if (!client)  return;
    const message = JSON.stringify({
        type: "DISCONNECT"
    });
    client.write(message + "\n"); 
});

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 900,
        minHeight: 660,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile("index.html");
}


app.whenReady().then(() => {
    createWindow();
});