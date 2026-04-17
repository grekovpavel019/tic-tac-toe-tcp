const { app, BrowserWindow } = require('electron');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 900,
        minHeight: 660
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);