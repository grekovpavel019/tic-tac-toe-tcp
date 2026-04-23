const registrationPage = document.getElementById("registration-page");
const login = document.getElementById("login");

const gamePage = document.getElementById("game-page");

const noRoom = document.getElementById("no-room");
const roomContent = document.getElementById("room-content");

const chatInput = document.getElementById("chat__input");
const chatField = document.getElementById("chat__field")
const messageInput = document.getElementById("messageInput");

const createRoomBtn = document.getElementById("create-room");
const roomList = document.getElementById("room-list");
const modalWin = document.getElementById("modal-bg");
const modalEntryBtn = document.querySelector(".modal__entry");
const modalCancelBtn = document.querySelector(".modal__cancel");

const disconnectButton = document.getElementById("disconnect");

let userName;

let inRoom = false;

// === РЕГИСТРАЦИЯ ===

// registrationPage.addEventListener("submit", (event) => {
//     event.preventDefault();
    
//     if (validateLogin(login)) {
//         userName = login.value;
//         window.api.connect({ userName });
//     }

//     login.value = "";

// });

// window.api.onMessage((msg) => {
//     switch(msg.type) {
//         case "LOGIN_SUCCESS": {
//             registrationPage.style.display = "none";
//             gamePage.style.display = "block";
//             break;
//         }

//         case "LOGIN_ERROR": {
//             console.log(msg.reason);
//             break;
//         }
//     }
// });

// === ДИСКОННЕКТ ===

disconnectButton.addEventListener("click", (event) => {
    window.api.disconnect();
    registrationPage.style.display = "flex";
    gamePage.style.display = "none";
});

// === Создание комнаты ===

createRoomBtn.addEventListener("click", (event) => {
    modalWin.style.display = "flex";
});

modalEntryBtn.addEventListener("click", (event) => {
    const roomNameInput = document.getElementById("room-name-input");
    if (!roomNameInput.value) return;

    inRoom = true;

    roomContent.style.display = "flex";
    noRoom.style.display = "none";

    const roomItem = createRoom({
        title: roomNameInput.value,
        players: "1",
        spectators: "0",
        status: "WAITING"
    });

    roomList.append(roomItem);

    roomNameInput.value = "";
    modalWin.style.display = "none";
});

modalCancelBtn.addEventListener("click", (event) => {
    modalWin.style.display = "none";
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