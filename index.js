const registrationPage = document.getElementById("registration-page");
const login = document.getElementById("login");

const gamePage = document.getElementById("game-page");

const userNameField = document.querySelector(".username");
let userName;

const noRoom = document.getElementById("no-room");
const roomContent = document.getElementById("room-content");

const chatInput = document.getElementById("chat__input");
const chatField = document.getElementById("chat__field")
const messageInput = document.getElementById("messageInput");

const createRoomBtn = document.getElementById("create-room");
const roomList = document.getElementById("room-list");
const modalWin = document.getElementById("modal-bg");
const roomNameInput = document.getElementById("room-name-input");
const modalEntryBtn = document.querySelector(".modal__entry");
const modalCancelBtn = document.querySelector(".modal__cancel");

const getRooms = document.getElementById("get-rooms");

const disconnectButton = document.getElementById("disconnect");

let inRoom = false;

const rooms = new Map();

// === РЕГИСТРАЦИЯ ===

registrationPage.addEventListener("submit", (event) => {
    event.preventDefault();
    
    if (validateLogin(login)) {
        userName = login.value;
        window.api.connect({ userName });
    }

    userName = login.value;
    login.value = "";

});

window.api.onMessage((msg) => {
    switch(msg.type) {
        case "LOGIN_SUCCESS": {
            registrationPage.style.display = "none";
            gamePage.style.display = "block";

            userNameField.textContent = userName;
            break;
        }

        case "LOGIN_ERROR": {
            console.log(msg.reason);
            break;
        }

        case "ROOM_CREATED": {
            const room = msg.payload.room;

            const roomItem = createRoom({
                title: room.title,
                players: room.players,
                spectators: room.spectators,
                status: room.status
            });

            roomContent.style.display = "flex";
            noRoom.style.display = "none";

            roomItem.dataset.id = room.id;

            roomList.append(roomItem);
            break;
        }

        case "ROOMS_LIST": {
            rooms.clear();
            renderRooms(msg);

            break;
        }
    }
});

function renderRooms(msg) {
    roomList.innerHTML = "";

    for (const room of msg.rooms) {
        rooms.set(room.id, room);

        const roomItem = createRoom(room);
        roomItem.dataset.id = room.id;

        roomList.append(roomItem);
    }
}

// === ДИСКОННЕКТ ===

disconnectButton.addEventListener("click", (event) => {
    window.api.disconnect();

    userName = null;
    userNameField.textContent = "";

    registrationPage.style.display = "flex";
    gamePage.style.display = "none";
});

// === Создание комнаты ===

// обработка кнопки нажатия на создание комнаты
createRoomBtn.addEventListener("click", (event) => {
    if (inRoom) return;                                                 // ДОРАБОТАТЬ ❗❗❗

    modalWin.style.display = "flex";
});

// кнопка обновления комнат
getRooms.addEventListener("click", (event) => {
    window.api.send({
        type: "GET_ROOMS"
    });
});

// если создаем комнату
modalEntryBtn.addEventListener("click", (event) => {
    const value = roomNameInput.value;
    if (!value) return;

    // inRoom = true;

    window.api.send({
        type: "CREATE_ROOM",
        payload: {
            title: value
        }
    });
    
    modalWin.style.display = "none";
    roomNameInput.value = "";
});

// отмена создания комнаты
modalCancelBtn.addEventListener("click", (event) => {
    modalWin.style.display = "none";
    roomNameInput.value = "";
})

// === СООБЩЕНИЯ В ЧАТЕ ===

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

// === ХЭНДЛЕРЫ ===

function validateLogin(login) {
    const value = login.value.trim()
    return value !== "";
}

function createMessage(value, userName) {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `
        <div class="message__author">${userName}:</div>
        <div class="message__text">${value}</div>
    `;
    
    chatField.appendChild(message);
}

function createRoom({ title, players, spectators, status }) {
    const room = document.createElement("div");
    room.classList.add("room-item");
    
    const titleEL = document.createElement("h2");
    titleEL.textContent = title;

    const meta = document.createElement("div");
    meta.classList.add("room__meta");

    const playersEL = document.createElement("span");
    playersEL.classList.add("players");
    playersEL.textContent = `👥 ${players}/2`;

    const spectatorsEL = document.createElement("span");
    spectatorsEL.classList.add("spectators");
    spectatorsEL.textContent = `👁 ${spectators}`;

    const statusEL = document.createElement("span");
    statusEL.classList.add("status");
    statusEL.textContent = `${status}`;

    meta.append(playersEL, spectatorsEL, statusEL);
    room.append(titleEL, meta)

    return room;
}