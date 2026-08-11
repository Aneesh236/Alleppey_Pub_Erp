/* Alleppey Pub ERP - role-based demo login */

"use strict";

const USERS = {
    employee: {
        label: "Employee",
        username: "employee",
        password: "1234",
        dashboard: "emp_dash.html",
        icon: "fa-user-tie"
    },

    admin: {
        label: "Administrator",
        username: "admin",
        password: "admin123",
        dashboard: "admin-dashboard.html",
        icon: "fa-user-shield"
    }
};


const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");

const togglePasswordButton =
    document.getElementById("togglePassword");

const loginButton = document.getElementById("loginBtn");
const loginButtonText = loginButton.querySelector("span");

const forgotPasswordLink =
    document.getElementById("forgotPassword");

const toast = document.getElementById("toast");

const roleTitle = document.getElementById("roleTitle");
const roleMessage = document.getElementById("roleMessage");
const roleBadge = document.getElementById("roleBadge");
const roleIcon = document.getElementById("roleIcon");
const roleName = document.getElementById("roleName");
const demoLogin = document.getElementById("demoLogin");


let toastTimer;
let activeRole = "";


/* ==========================================
   GET SELECTED ROLE
========================================== */

function getSelectedRole() {
    const urlParameters =
        new URLSearchParams(window.location.search);

    const urlRole = urlParameters.get("role");

    const savedRole =
        localStorage.getItem("selectedRole");

    const role = urlRole || savedRole;

    if (USERS[role]) {
        return role;
    }

    return "";
}


/* ==========================================
   SET UP LOGIN PAGE
========================================== */

function setupLoginPage() {
    activeRole = getSelectedRole();

    if (!activeRole) {
        window.location.replace("role-selection.html");
        return;
    }

    const user = USERS[activeRole];

    localStorage.setItem("selectedRole", activeRole);

    document.title =
        `${user.label} Login | Alleppey Pub ERP`;

    roleTitle.textContent =
        `${user.label} Login`;

    roleMessage.textContent =
        `Enter your ${user.label.toLowerCase()} credentials`;

    roleName.textContent = user.label;

    roleIcon.className =
        `fa-solid ${user.icon}`;

    roleBadge.classList.add(activeRole);

    demoLogin.textContent =
        `${user.username} / ${user.password}`;

    restoreRememberedUser();
}


/* ==========================================
   TOAST MESSAGE
========================================== */

function showToast(message, type = "") {
    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.className = type;

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* ==========================================
   INPUT ERRORS
========================================== */

function clearInputErrors() {
    usernameInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
}


/* ==========================================
   LOADING BUTTON
========================================== */

function setLoading(isLoading) {
    loginButton.disabled = isLoading;

    loginButtonText.textContent =
        isLoading ? "Logging in..." : "Login";

    loginButton.querySelector("i").className =
        isLoading
            ? "fa-solid fa-spinner fa-spin"
            : "fa-solid fa-right-to-bracket";
}


/* ==========================================
   SAVE LOGIN SESSION
========================================== */

function saveSession(username) {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("employeeLoggedIn");

    sessionStorage.setItem(
        "loggedInUser",
        username
    );

    sessionStorage.setItem(
        "userRole",
        activeRole
    );

    sessionStorage.setItem(
        "isLoggedIn",
        "true"
    );

    sessionStorage.setItem(
        `${activeRole}LoggedIn`,
        "true"
    );

    localStorage.setItem(
        "userRole",
        activeRole
    );

    localStorage.setItem(
        "loggedInUser",
        username
    );

    localStorage.setItem(
        `${activeRole}LoggedIn`,
        "true"
    );

    const otherRole =
        activeRole === "admin"
            ? "employeeLoggedIn"
            : "adminLoggedIn";

    localStorage.removeItem(otherRole);
}


/* ==========================================
   REMEMBER USERNAME
========================================== */

function saveRememberedUser(username) {
    const storageKey =
        `rememberUser_${activeRole}`;

    if (rememberInput.checked) {
        localStorage.setItem(
            storageKey,
            username
        );
    } else {
        localStorage.removeItem(storageKey);
    }
}


function restoreRememberedUser() {
    const rememberedUsername =
        localStorage.getItem(
            `rememberUser_${activeRole}`
        );

    if (rememberedUsername) {
        usernameInput.value =
            rememberedUsername;

        rememberInput.checked = true;
    }
}


/* ==========================================
   LOGIN
========================================== */

function login(event) {
    event.preventDefault();

    clearInputErrors();

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    const user = USERS[activeRole];

    if (!username) {
        usernameInput.classList.add("input-error");
        usernameInput.focus();

        showToast(
            "Please enter your username",
            "error"
        );

        return;
    }

    if (!password) {
        passwordInput.classList.add("input-error");
        passwordInput.focus();

        showToast(
            "Please enter your password",
            "error"
        );

        return;
    }

    const usernameMatches =
        username.toLowerCase() ===
        user.username.toLowerCase();

    const passwordMatches =
        password === user.password;

    if (!usernameMatches || !passwordMatches) {
        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");

        showToast(
            `Invalid ${user.label.toLowerCase()} credentials`,
            "error"
        );

        return;
    }

    setLoading(true);

    saveSession(username);
    saveRememberedUser(username);

    showToast(
        `Welcome, ${username}!`,
        "success"
    );

    setTimeout(() => {
        window.location.href =
            user.dashboard;
    }, 700);
}


/* ==========================================
   PASSWORD VISIBILITY
========================================== */

togglePasswordButton.addEventListener(
    "click",
    () => {
        const isHidden =
            passwordInput.type === "password";

        passwordInput.type =
            isHidden ? "text" : "password";

        const icon =
            togglePasswordButton.querySelector("i");

        icon.className =
            isHidden
                ? "fa-solid fa-eye-slash"
                : "fa-solid fa-eye";

        togglePasswordButton.setAttribute(
            "aria-label",
            isHidden
                ? "Hide password"
                : "Show password"
        );

        passwordInput.focus();
    }
);


/* ==========================================
   FORGOT PASSWORD
========================================== */

forgotPasswordLink.addEventListener(
    "click",
    event => {
        event.preventDefault();

        showToast(
            "Password recovery is unavailable in this demo.",
            "error"
        );
    }
);


/* ==========================================
   EVENTS
========================================== */

usernameInput.addEventListener(
    "input",
    clearInputErrors
);

passwordInput.addEventListener(
    "input",
    clearInputErrors
);

loginForm.addEventListener(
    "submit",
    login
);

window.addEventListener(
    "DOMContentLoaded",
    setupLoginPage
);