const registrationPage = document.getElementById("registration-page");
const login = document.getElementById("login");
const registrationBtn = document.getElementById("registration__btn");
const messengerPage = document.getElementById("messenger-page");

let userName;

registrationPage.addEventListener("submit", (event) => {
    event.preventDefault();
    
    if (validateLogin(login)) {
        userName = login.value;

        window.api.connect({
            userName
        });
    }

});

window.api.onMessage((msg) => {
    switch(msg.type) {
        case "LOGIN_SUCCESS": {
            registrationPage.style.display = "none";
            messengerPage.style.display = "block";
            break;
        }

        case "LOGIN_ERROR": {
            console.log(msg.reason);
            break;
        }
    }
});

function validateLogin(login) {
    const value = login.value.trim()
    return value !== "";
}

const chatInput = document.getElementById("chat__input");
const chatField = document.getElementById("chat__field")
const messageInput = document.getElementById("messageInput");

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

function createMessage(value, userName) {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `
        <div class="message__author">${userName}:</div>
        <div class="message__text">${value}</div>
    `;
    
    chatField.appendChild(message);
}
