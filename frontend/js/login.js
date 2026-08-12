"use strict";

/* Alleppey Pub ERP - secure staff login */

const ROLE_DETAILS = {
    employee: {
        label: "Employee",
        dashboard: "emp_dash.html",
        icon: "fa-user-tie"
    },
    admin: {
        label: "Administrator",
        dashboard: "admin-dashboard.html",
        icon: "fa-user-shield"
    }
};

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");
const togglePasswordButton = document.getElementById("togglePassword");
const loginButton = document.getElementById("loginBtn");
const loginButtonText = loginButton.querySelector("span");
const forgotPasswordLink = document.getElementById("forgotPassword");
const toast = document.getElementById("toast");
const roleTitle = document.getElementById("roleTitle");
const roleMessage = document.getElementById("roleMessage");
const roleBadge = document.getElementById("roleBadge");
const roleIcon = document.getElementById("roleIcon");
const roleName = document.getElementById("roleName");

let toastTimer = null;
let activeRole = "";

function getApiBaseUrl() {
    const baseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");
    if (!baseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }
    return baseUrl;
}

function getSelectedRole() {
    const urlRole = new URLSearchParams(window.location.search).get("role");
    const savedRole = localStorage.getItem("selectedRole");
    const role = urlRole || savedRole;
    return ROLE_DETAILS[role] ? role : "";
}

function setupLoginPage() {
    activeRole = getSelectedRole();

    if (!activeRole) {
        window.location.replace("role-selection.html");
        return;
    }

    const details = ROLE_DETAILS[activeRole];
    localStorage.setItem("selectedRole", activeRole);
    document.title = `${details.label} Login | Alleppey Pub ERP`;
    roleTitle.textContent = `${details.label} Login`;
    roleMessage.textContent = `Enter your ${details.label.toLowerCase()} credentials`;
    roleName.textContent = details.label;
    roleIcon.className = `fa-solid ${details.icon}`;
    roleBadge.classList.add(activeRole);
    restoreRememberedUsername();
}

async function requestLogin(username, password) {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            password,
            role: activeRole
        })
    });

    let result = null;
    try {
        result = await response.json();
    } catch (error) {
        console.error("The login response could not be read.", error);
    }

    if (!response.ok) {
        throw new Error(result?.detail || `Login failed (${response.status}).`);
    }

    if (!result?.accessToken || result?.user?.role !== activeRole) {
        throw new Error("The server returned an invalid login session.");
    }

    return result;
}

function clearStaffSession() {
    const keys = [
        "authToken",
        "loggedInUser",
        "displayName",
        "userRole",
        "isLoggedIn",
        "adminLoggedIn",
        "employeeLoggedIn",
        "authExpiresAt"
    ];

    keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function saveSession(result) {
    clearStaffSession();

    const user = result.user;

    // Keep all authentication values together. Splitting them between
    // localStorage and sessionStorage caused valid users to be redirected.
    localStorage.setItem("authToken", result.accessToken);
    localStorage.setItem("loggedInUser", user.username);
    localStorage.setItem("displayName", user.displayName || user.username);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem(`${user.role}LoggedIn`, "true");
    localStorage.setItem(
        "authExpiresAt",
        String(Date.now() + (Number(result.expiresIn) || 28800) * 1000)
    );
}

function saveRememberedUsername(username) {
    const key = `rememberUser_${activeRole}`;
    if (rememberInput.checked) {
        localStorage.setItem(key, username);
    } else {
        localStorage.removeItem(key);
    }
}

function restoreRememberedUsername() {
    const username = localStorage.getItem(`rememberUser_${activeRole}`);
    if (username) {
        usernameInput.value = username;
        rememberInput.checked = true;
    }
}

async function login(event) {
    event.preventDefault();
    clearInputErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
        markInputError(usernameInput);
        usernameInput.focus();
        showToast("Please enter your username.", "error");
        return;
    }

    if (!password) {
        markInputError(passwordInput);
        passwordInput.focus();
        showToast("Please enter your password.", "error");
        return;
    }

    setLoading(true);

    try {
        const result = await requestLogin(username, password);
        saveSession(result);
        saveRememberedUsername(username);
        passwordInput.value = "";
        showToast(`Welcome, ${result.user.displayName || username}!`, "success");

        window.setTimeout(() => {
            window.location.href = ROLE_DETAILS[activeRole].dashboard;
        }, 700);
    } catch (error) {
        markInputError(usernameInput);
        markInputError(passwordInput);
        const message = error instanceof TypeError
            ? "Cannot reach the backend. Start RUN_AI.bat and try again."
            : (error.message || "Login failed.");
        showToast(message, "error");
        setLoading(false);
    }
}

function markInputError(input) {
    input.classList.add("input-error");
}

function clearInputErrors() {
    usernameInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    loginButtonText.textContent = isLoading ? "Signing in..." : "Login";
    loginButton.querySelector("i").className = isLoading
        ? "fa-solid fa-spinner fa-spin"
        : "fa-solid fa-right-to-bracket";
}

function showToast(message, type = "") {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = type;
    requestAnimationFrame(() => toast.classList.add("show"));
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

togglePasswordButton.addEventListener("click", () => {
    const hidden = passwordInput.type === "password";
    passwordInput.type = hidden ? "text" : "password";
    togglePasswordButton.querySelector("i").className = hidden
        ? "fa-solid fa-eye-slash"
        : "fa-solid fa-eye";
    togglePasswordButton.setAttribute(
        "aria-label",
        hidden ? "Hide password" : "Show password"
    );
    passwordInput.focus();
});

forgotPasswordLink.addEventListener("click", event => {
    event.preventDefault();
    showToast("Ask the administrator to reset your password.", "error");
});

usernameInput.addEventListener("input", clearInputErrors);
passwordInput.addEventListener("input", clearInputErrors);
loginForm.addEventListener("submit", login);
window.addEventListener("DOMContentLoaded", setupLoginPage);
