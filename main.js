const { app, BrowserWindow, ipcMain } = require('electron');
const net = require("net");

let client;
let mainWindow;

function connectTCP() {
    client = net.createConnection({
        port: 4000
    });

    client.on("data", (data) => {
        const msg = data.toString().trim();

        mainWindow.webContents.send("tcp:message", msg);
    });
}

ipcMain.on("tcp:send", (event, message) => {
    client.write(message + "\n");
})

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 900,
        minHeight: 660
    });

    mainWindow.loadFile("index.html");

    connectTCP();
}

app.whenReady().then(createWindow);