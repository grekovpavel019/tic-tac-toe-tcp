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

const gameMode = document.getElementById("game-mode");
const playerBtn = document.getElementById("player");
const spectatorBtn = document.getElementById("spectator");

const getRooms = document.getElementById("get-rooms");

const disconnectButton = document.getElementById("disconnect");

let userName;
let inRoom = false;
const rooms = new Map();

// === РЕГИСТРАЦИЯ ===

registrationPage.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const value = login.value.trim
    if (!value) return;
    
    userName = login.value;
    window.api.connect({ userName });
    
    login.value = "";
});

window.api.onMessage((msg) => {
    switch(msg.type) {
        case "LOGIN_SUCCESS": {
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
    rooms.set(room.id, room);

    const old = document.querySelector(`[data-id="${room.id}"]`);
    if (old) old.replaceWith(createRoom(room));
}

function deleteRoom(id) {
    rooms.delete(id);

    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
}

// ---------------------- MODAL FLOW --------------------------

// обработка кнопки нажатия на создание комнаты
createRoomBtn.addEventListener("click", (event) => {
    if (inRoom) return;                                              // ДОРАБОТАТЬ ❗❗❗

    modalWin.style.display = "flex";
});

// отмена создания комнаты
modalCancelBtn.addEventListener("click", (event) => {
    closeModal();
});

function closeModal() {
    roomNameInput.value = "";

    modalWin.style.display = "none";
    gameMode.style.display = "none";
}

// -------------------------- CREATE ROOM FLOW ----------------------------

function showGameMode() {
    roomInputMod.style.display = "none";
    gameMode.style.display = "flex";
}

// если создаем комнату
modalEntryBtn.addEventListener("click", async (event) => {
    const title = roomNameInput.value;
    if (!title) return;

    showGameMode();
    const mode = await chooseMode();
    
    window.api.send({
        type: "CREATE_ROOM",
        payload: {
            title,
            mode
        }
    });
    
    closeModal();
    roomNameInput.value = "";
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

function showGamePage() {
    registrationPage.style.display = "none";
    gamePage.style.display = "flex";
}

function showRegistrationPage() {
    registrationPage.style.display = "flex";
    gamePage.style.display = "none";
}

disconnectButton.addEventListener("click", (event) => {
    window.api.disconnect();

    userName = null;
    userNameField.textContent = "";

    // ставим поле регистрации
    showRegistrationPage();

    // чистим список комнат
    roomList.innerHTML = "";

    modalWin.style.display = "none";
    gameMode.style.display = "none";
    roomInputMod.style.display = "flex";

    // ставим убираем содержимое комнаты, и ставим ничего
    roomContent.style.display = "none";
    noRoom.style.display = "flex";

    roomNameInput.value = "";

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
        window.api.send({
            type: "JOIN_ROOM",
            payload: { roomId: id }
        });
    });

    return room;
}

function chooseMode() {
    return new Promise((resolve) => {
        gameMode.style.display = "flex";

        const onPlayer = () => {
            cleanup();
            resolve("PLAYER");
        };

        const onSpectator = () => {
            cleanup();
            resolve("SPECTATOR");
        };

        function cleanup() {
            gameMode.style.display = "none";
            playerBtn.removeEventListener("click", onPlayer);
            spectatorBtn.removeEventListener("click", onSpectator);
        }

        playerBtn.addEventListener("click", onPlayer, { once: true });
        spectatorBtn.addEventListener("click", onSpectator, { once: true });
    });
}