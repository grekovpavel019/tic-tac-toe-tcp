const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    connect: (options) => {
        ipcRenderer.send("tcp-connect", options);
    },

    disconnect: () => {
        ipcRenderer.send("tcp-disconnect");
    },

    sendMessage: (msg) => {
        ipcRenderer.send("tcp-send", msg);
    },

    onMessage: (callback) => {
        ipcRenderer.on("tcp-message", (event, data) => {
            callback(data);
        })
    },
})