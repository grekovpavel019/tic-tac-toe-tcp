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

    client.on("connect", () => {
        const message = JSON.stringify({
            type: "CONNECT",
            userName
        });

        client.write(message + "\n");
    })

    client.on("data", (data) => {
        const messages = data.toString().split("\n");

        messages.forEach((msg) => {
            if (!msg.trim()) return;

            try {
                const message = JSON.parse(msg);
                mainWindow.webContents.send("tcp-message", message);
            } catch (e) {
                console.log("Bad JSON: ", msg)
            }

        })
    });

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