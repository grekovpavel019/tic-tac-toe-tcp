const registrationPage = document.getElementById("registration-page");
const login = document.getElementById("login");
const registrationBtn = document.getElementById("registration__btn");
const messengerPage = document.getElementById("messenger-page");


// if (localStorage.userName) {
//     showMessenger();
// } else {
//     showRegistration();
// }

// let userName = localStorage.userName;

// function showMessenger() {
//     registrationPage.style.display = "none";
//     messengerPage.style.display = "block";
// }

// function showRegistration() {
//     registrationPage.style.display = "flex";
//     messengerPage.style.display = "none";
// }

registrationPage.addEventListener("submit", (event) => {
    event.preventDefault();
    
    if (validateLogin(login)) {
        userName = login.value;

        localStorage.setItem("userName", userName);
        registrationPage.style.display = "none";
        messengerPage.style.display = "block";
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

    createMessage(messageInput.value, userName);
    messageInput.value = "";
});

function createMessage(value, userName) {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `
        <div class="message__author">${userName}:</div>
        <div class="message__text">${value}</div>
    `;
    
    chatField.appendChild(message);
}
