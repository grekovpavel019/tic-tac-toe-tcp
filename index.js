const registrationPage = document.getElementById("registration-page");
const login = document.getElementById("login");

const gamePage = document.getElementById("game-page");

const userNameField = document.querySelector(".username");

const noRoom = document.getElementById("no-room");
const roomContent = document.getElementById("room-content");

const chatInput = document.getElementById("chat__input");
const chatField = document.getElementById("chat__field")
const messageInput = document.getElementById("messageInput");

const createRoomBtn = document.getElementById("create-room");
const roomList = document.getElementById("room-list");

const modalWin = document.getElementById("modal-bg");

const roomInputMod = document.getElementById("room-input");
const roomNameInput = document.getElementById("room-name-input");
const modalEntryBtn = document.querySelector("#entry");
const modalCancelBtn = document.querySelector("#cancel");

const gameMode = document.getElementById("game-mode-bg");
const playerBtn = document.getElementById("player");
const spectatorBtn = document.getElementById("spectator");

const getRooms = document.getElementById("get-rooms");

const disconnectButton = document.getElementById("disconnect");

let userName = null;
let inRoom = false;
let roomCreated = false;
const rooms = new Map();

// === РЕГИСТРАЦИЯ ===

registrationPage.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const value = login.value.trim();
    if (!value) return;
    
    userName = login.value;
    window.api.connect({ userName });
    
    login.value = "";
});

window.api.onMessage((msg) => {
    switch(msg.type) {
        case "LOGIN_SUCCESS": {
            hideRegistrationPage();
            showGamePage();

            userNameField.textContent = userName;

            window.api.send({
                type: "GET_ROOMS"
            });

            break;
        }

        case "LOGIN_ERROR": {
            console.log(msg.reason);
            break;
        }

        case "ROOM_CREATED": {
            addRoom(msg.payload.room);
            break;
        }

        case "ROOMS_LIST": {
            rooms.clear();
            renderRooms(msg.rooms);

            break;
        }

        case "ROOM_DELETED": {
            deleteRoom(msg.payload.id);
            break;
        }

        case "ROOM_UPDATED": {
            updateRoom(msg.payload.room);
            break;
        }

        case "JOIN_REJECT": {
            
        }
    }
});

function renderRooms(list) {
    roomList.innerHTML = "";
    list.forEach(addRoom);
}

function addRoom(room) {
    rooms.set(room.id, room);

    const el = createRoom(room);
    el.dataset.id = room.id;
    roomList.appendChild(el);
}

function updateRoom(room) {
    const el = document.querySelector(`[data-id="${room.id}"]`);
    if (!el) return;

    el.querySelector(".players").textContent = `👥 ${room.players.length}/2`;
    el.querySelector(".spectators").textContent = `👁 ${room.spectators.length}`;
    el.querySelector(".status").textContent = room.status;
}

function deleteRoom(id) {
    rooms.delete(id);

    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
}


function showRegistrationPage() {
    registrationPage.style.display = "flex";
}

function hideRegistrationPage() {
    registrationPage.style.display = "none";
}

function showGamePage() {
    gamePage.style.display = "flex";
}

function hideGamePage() {
    gamePage.style.display = "none";
}

function showModalWindow() {
    modalWin.style.display = "flex";
}

function hideModalWindow() {
    modalWin.style.display = "none";
}

function showGameMode() {
    gameMode.style.display = "flex";
}

function hideGameMode() {
    gameMode.style.display = "none";
}

function showRoomContent() {
    roomContent.style.display = "flex";
    noRoom.style.display = "none";
}

function hideRoomContent() {
    roomContent.style.display = "none";
    noRoom.style.display = "flex";
}

// ---------------------- MODAL FLOW --------------------------

// обработка кнопки нажатия на создание комнаты
createRoomBtn.addEventListener("click", (event) => {
    if (inRoom) return;
    if (roomCreated) return;                                              // ДОРАБОТАТЬ ❗❗❗

    showModalWindow();
});


function closeModal() {
    roomNameInput.value = "";

    modalWin.style.display = "none";
}

// -------------------------- CREATE ROOM FLOW ----------------------------

function showGameMode() {
    gameMode.style.display = "flex";
}

// если создаем комнату
modalEntryBtn.addEventListener("click", (event) => {
    const title = roomNameInput.value;
    if (!title) return;
    
    window.api.send({
        type: "CREATE_ROOM",
        payload: {
            title,
        }
    });
    
    roomNameInput.value = "";
    hideModalWindow();
});

// отмена создания комнаты
modalCancelBtn.addEventListener("click", (event) => {
    roomNameInput.value = "";
    hideModalWindow();
});

// ------------------------------ JOIN ROOM ---------------------------------

let currentRoomId = null;

playerBtn.addEventListener("click", (event) => {
    if (!currentRoomId) return;

    window.api.send({
        type: "JOIN_ROOM",
        payload: {
            id: currentRoomId,
            mode: "PLAYER"
        }
    });

    hideGameMode();
    showRoomContent();
    currentRoomId = null;
});

spectatorBtn.addEventListener("click", (event) => {
    if (!currentRoomId) return;
    
    window.api.send({
        type: "JOIN_ROOM",
        payload: {
            id: currentRoomId,
            mode: "SPECTATOR"
        }
    });
    
    hideGameMode();
    showRoomContent();

    currentRoomId = null;
});


// ------------------------- UPDATE ROOMS ------------------------------------

// кнопка обновления комнат
getRooms.addEventListener("click", (event) => {
    window.api.send({
        type: "GET_ROOMS"
    });
});

// ------------------------ CHAT MESSENGER ------------------------------------

chatInput.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = messageInput.value.trim();

    if (!value) return;

    // window.api.sendMessage(`${userName}: ${value}`);

    createMessage(messageInput.value, userName);
    messageInput.value = "";
});

// window.api.onMessage((msg) => {
//     createMessage(msg, "remote");
// });


// --------------------------- DISCONNECT ----------------------
disconnectButton.addEventListener("click", (event) => {
    window.api.disconnect();

    userName = null;
    userNameField.textContent = "";

    // ставим поле регистрации
    hideGamePage();
    showRegistrationPage();

    hideRoomContent();

    // чистим список комнат
    roomList.innerHTML = "";

    // ставим убираем содержимое комнаты, и ставим ничего
    rooms.clear();
});


// ------------------------------- HANDLERS -------------------------------------

function createMessage(value, userName) {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `
        <div class="message__author">${userName}:</div>
        <div class="message__text">${value}</div>
    `;
    
    chatField.appendChild(message);
}

function createRoom({ id, title, players, spectators, status }) {
    const room = document.createElement("div");
    room.classList.add("room-item");
    
    const titleEL = document.createElement("h2");
    titleEL.textContent = title;

    const meta = document.createElement("div");
    meta.classList.add("room__meta");

    const playersEL = document.createElement("span");
    playersEL.classList.add("players");
    playersEL.textContent = `👥 ${players.length}/2`;

    const spectatorsEL = document.createElement("span");
    spectatorsEL.classList.add("spectators");
    spectatorsEL.textContent = `👁 ${spectators.length}`;

    const statusEL = document.createElement("span");
    statusEL.classList.add("status");
    statusEL.textContent = `${status}`;

    meta.append(playersEL, spectatorsEL, statusEL);
    room.append(titleEL, meta)

    room.addEventListener("click", (event) => {
        currentRoomId = id;

        showGameMode();
    });


    return room;
}