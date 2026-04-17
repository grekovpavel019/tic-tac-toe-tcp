const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    sendMessage: (msg) => ipcRenderer.send("tcp:send", msg),

    onMessage: (callback) => {
        ipcRenderer.on("tcp:message", (event, data) => {
            callback(data);
        })
    }
})