/* ==========================================
   LOGIN.JS
   Alleppey Pub ERP
========================================== */

"use strict";


/* ==========================================
   DEMO USERS
========================================== */

const users = {

    employee: {
        username: "employee",
        password: "1234",
        redirect: "emp_dash.html"
    },

    admin: {
        username: "admin",
        password: "admin123",
        redirect: "admin-dashboard.html"
    }

};


/* ==========================================
   ELEMENTS
========================================== */

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");

const togglePasswordButton =
    document.getElementById("togglePassword");

const loginButton = document.getElementById("loginBtn");
const loginButtonText = loginButton.querySelector("span");

const toast = document.getElementById("toast");

const forgotPasswordLink =
    document.getElementById("forgotPassword");


/* ==========================================
   TOAST
========================================== */

let toastTimer;

function showToast(message, type = "") {

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.className = "";

    if (type) {
        toast.classList.add(type);
    }

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);

}


/* ==========================================
   PASSWORD TOGGLE
========================================== */

togglePasswordButton.addEventListener("click", () => {

    const passwordIsHidden =
        passwordInput.type === "password";

    passwordInput.type =
        passwordIsHidden ? "text" : "password";

    const icon =
        togglePasswordButton.querySelector("i");

    icon.classList.toggle("fa-eye", !passwordIsHidden);
    icon.classList.toggle("fa-eye-slash", passwordIsHidden);

    togglePasswordButton.setAttribute(
        "aria-label",
        passwordIsHidden
            ? "Hide password"
            : "Show password"
    );

    passwordInput.focus();

});


/* ==========================================
   INPUT ERROR HANDLING
========================================== */

function markInputError(input) {

    input.classList.add("input-error");

}

function clearInputErrors() {

    usernameInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");

}

usernameInput.addEventListener("input", clearInputErrors);
passwordInput.addEventListener("input", clearInputErrors);


/* ==========================================
   BUTTON LOADING STATE
========================================== */

function setLoading(isLoading) {

    loginButton.disabled = isLoading;

    if (isLoading) {

        loginButtonText.textContent = "Logging in...";

        loginButton
            .querySelector("i")
            .className = "fa-solid fa-spinner fa-spin";

    } else {

        loginButtonText.textContent = "Login";

        loginButton
            .querySelector("i")
            .className = "fa-solid fa-right-to-bracket";

    }

}


/* ==========================================
   LOGIN
========================================== */

function login(event) {

    event.preventDefault();

    clearInputErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberInput.checked;

    const selectedRole =
        document.querySelector(
            'input[name="role"]:checked'
        );

    // Validate role
    if (!selectedRole) {

        showToast(
            "Please select Employee or Administrator",
            "error"
        );

        return;

    }

    // Validate username
    if (!username) {

        markInputError(usernameInput);

        showToast(
            "Please enter your username",
            "error"
        );

        usernameInput.focus();

        return;

    }

    // Validate password
    if (!password) {

        markInputError(passwordInput);

        showToast(
            "Please enter your password",
            "error"
        );

        passwordInput.focus();

        return;

    }

    const role = selectedRole.value;
    const selectedUser = users[role];

    if (!selectedUser) {

        showToast(
            "The selected role is not available",
            "error"
        );

        return;

    }

    // Check credentials
    const usernameMatches =
        username.toLowerCase() ===
        selectedUser.username.toLowerCase();

    const passwordMatches =
        password === selectedUser.password;

    if (!usernameMatches || !passwordMatches) {

        markInputError(usernameInput);
        markInputError(passwordInput);

        showToast(
            "Invalid username or password",
            "error"
        );

        return;

    }

    setLoading(true);

    // Save current login session
    sessionStorage.setItem("loggedInUser", username);
    sessionStorage.setItem("userRole", role);
    sessionStorage.setItem("isLoggedIn", "true");

    // Remember only non-sensitive login information
    if (remember) {

        localStorage.setItem("rememberUser", username);
        localStorage.setItem("rememberRole", role);

    } else {

        localStorage.removeItem("rememberUser");
        localStorage.removeItem("rememberRole");

    }

    showToast(
        `Welcome, ${username}! Login successful.`,
        "success"
    );

    setTimeout(() => {

        window.location.href = selectedUser.redirect;

    }, 1000);

}


/* ==========================================
   RESTORE REMEMBERED USER
========================================== */

function restoreRememberedUser() {

    const rememberedUsername =
        localStorage.getItem("rememberUser");

    const rememberedRole =
        localStorage.getItem("rememberRole");

    if (rememberedUsername) {

        usernameInput.value = rememberedUsername;
        rememberInput.checked = true;

    }

    if (rememberedRole) {

        const roleInput =
            document.querySelector(
                `input[name="role"][value="${rememberedRole}"]`
            );

        if (roleInput) {
            roleInput.checked = true;
        }

    }

}


/* ==========================================
   FORGOT PASSWORD
========================================== */

forgotPasswordLink.addEventListener("click", event => {

    event.preventDefault();

    showToast(
        "Password recovery is unavailable in this demo.",
        "error"
    );

});


/* ==========================================
   EVENTS
========================================== */

loginForm.addEventListener("submit", login);

window.addEventListener("DOMContentLoaded", () => {

    restoreRememberedUser();

});