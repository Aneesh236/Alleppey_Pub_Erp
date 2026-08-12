"use strict";

/* Alleppey Pub ERP - secure staff account management */

let staffUsers = [];
let toastTimer = null;

const elements = {
    sidebar: document.getElementById("sidebar"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    menuToggle: document.getElementById("menuToggle"),
    sidebarUsername: document.getElementById("sidebarUsername"),
    logoutBtn: document.getElementById("logoutBtn"),
    refreshBtn: document.getElementById("refreshStaffBtn"),
    openAddBtn: document.getElementById("openAddStaffBtn"),
    totalStaff: document.getElementById("totalStaff"),
    activeStaff: document.getElementById("activeStaff"),
    adminCount: document.getElementById("adminCount"),
    employeeCount: document.getElementById("employeeCount"),
    resultCount: document.getElementById("resultCount"),
    search: document.getElementById("staffSearch"),
    roleFilter: document.getElementById("roleFilter"),
    statusFilter: document.getElementById("statusFilter"),
    tableBody: document.getElementById("staffTableBody"),
    emptyState: document.getElementById("emptyState"),
    staffModal: document.getElementById("staffModal"),
    staffModalTitle: document.getElementById("staffModalTitle"),
    staffForm: document.getElementById("staffForm"),
    staffId: document.getElementById("staffId"),
    displayName: document.getElementById("displayName"),
    usernameGroup: document.getElementById("usernameGroup"),
    username: document.getElementById("staffUsername"),
    role: document.getElementById("staffRole"),
    passwordGroup: document.getElementById("passwordGroup"),
    password: document.getElementById("staffPassword"),
    activeGroup: document.getElementById("activeGroup"),
    active: document.getElementById("staffActive"),
    saveStaffBtn: document.getElementById("saveStaffBtn"),
    passwordModal: document.getElementById("passwordModal"),
    passwordForm: document.getElementById("passwordForm"),
    passwordStaffId: document.getElementById("passwordStaffId"),
    passwordStaffName: document.getElementById("passwordStaffName"),
    newPassword: document.getElementById("newPassword"),
    confirmPassword: document.getElementById("confirmPassword"),
    resetPasswordBtn: document.getElementById("resetPasswordBtn"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage")
};


/* Authentication and API */

function getStoredValue(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}


function getAuthToken() {
    return getStoredValue("authToken");
}


function clearStaffSession() {
    const keys = [
        "authToken", "loggedInUser", "displayName", "userRole",
        "isLoggedIn", "adminLoggedIn", "employeeLoggedIn", "authExpiresAt"
    ];

    [localStorage, sessionStorage].forEach(storage => {
        keys.forEach(key => storage.removeItem(key));
    });
}


function redirectToLogin() {
    clearStaffSession();
    window.location.replace("role-selection.html");
}


function checkAdminAccess() {
    const role = getStoredValue("userRole");
    const loggedIn =
        sessionStorage.getItem("adminLoggedIn") === "true" ||
        localStorage.getItem("adminLoggedIn") === "true";

    if (role !== "admin" || !loggedIn || !getAuthToken()) {
        redirectToLogin();
        return false;
    }
    return true;
}


function getApiBaseUrl() {
    const baseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");
    if (!baseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }
    return baseUrl;
}


async function apiRequest(path, options = {}) {
    const token = getAuthToken();
    if (!token) {
        redirectToLogin();
        throw new Error("Please log in again.");
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    let result = null;
    if (response.status !== 204) {
        try {
            result = await response.json();
        } catch (error) {
            console.error("The server response could not be read.", error);
        }
    }

    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error("Your admin session expired. Please log in again.");
    }

    if (!response.ok) {
        const validationMessage = Array.isArray(result?.detail)
            ? result.detail.map(item => item.msg).join(" ")
            : result?.detail;
        throw new Error(validationMessage || `Server error ${response.status}`);
    }

    return result;
}


/* Data */

function normalizeUser(user) {
    return {
        id: Number(user.id),
        username: String(user.username || ""),
        displayName: String(user.displayName || user.username || "Staff Member"),
        role: String(user.role || "employee").toLowerCase(),
        isActive: Boolean(user.isActive),
        createdAt: String(user.createdAt || "")
    };
}


async function loadStaff(showSuccess = false) {
    setButtonLoading(elements.refreshBtn, true);
    elements.resultCount.textContent = "Loading staff accounts...";

    try {
        const result = await apiRequest("/staff");
        staffUsers = Array.isArray(result) ? result.map(normalizeUser) : [];
        renderPage();
        if (showSuccess) showToast("Staff accounts refreshed.");
    } catch (error) {
        elements.resultCount.textContent = "Staff accounts could not be loaded.";
        showToast(error.message, "error");
    } finally {
        setButtonLoading(elements.refreshBtn, false);
    }
}


function getFilteredUsers() {
    const query = elements.search.value.trim().toLowerCase();
    const role = elements.roleFilter.value;
    const status = elements.statusFilter.value;

    return staffUsers.filter(user => {
        const matchesQuery = !query ||
            user.displayName.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query);
        const matchesRole = role === "all" || user.role === role;
        const matchesStatus = status === "all" ||
            (status === "active" && user.isActive) ||
            (status === "inactive" && !user.isActive);
        return matchesQuery && matchesRole && matchesStatus;
    });
}


/* Rendering */

function renderPage() {
    renderSummary();
    renderTable();
}


function renderSummary() {
    elements.totalStaff.textContent = staffUsers.length;
    elements.activeStaff.textContent = staffUsers.filter(user => user.isActive).length;
    elements.adminCount.textContent = staffUsers.filter(user => user.role === "admin").length;
    elements.employeeCount.textContent = staffUsers.filter(user => user.role === "employee").length;
}


function renderTable() {
    const users = getFilteredUsers();
    const currentUsername = getStoredValue("loggedInUser");

    elements.resultCount.textContent = `${users.length} of ${staffUsers.length} accounts shown`;
    elements.emptyState.hidden = users.length > 0;
    elements.tableBody.innerHTML = users.map(user => {
        const isCurrentUser = user.username === currentUsername;
        const initials = getInitials(user.displayName);
        const roleIcon = user.role === "admin" ? "fa-user-shield" : "fa-user-tie";
        const toggleTitle = user.isActive ? "Deactivate account" : "Activate account";
        const toggleIcon = user.isActive ? "fa-user-slash" : "fa-user-check";
        const toggleClass = user.isActive ? "danger" : "success";

        return `
            <tr>
                <td>
                    <div class="staff-identity">
                        <span class="staff-avatar">${escapeHtml(initials)}</span>
                        <div>
                            <strong>${escapeHtml(user.displayName)}</strong>
                            <small>${isCurrentUser ? "Your account" : `Staff ID ${user.id}`}</small>
                        </div>
                    </div>
                </td>
                <td>@${escapeHtml(user.username)}</td>
                <td>
                    <span class="role-badge ${user.role}">
                        <i class="fa-solid ${roleIcon}"></i>
                        ${user.role === "admin" ? "Administrator" : "Employee"}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? "active" : "inactive"}">
                        <span class="status-dot"></span>
                        ${user.isActive ? "Active" : "Inactive"}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="row-actions">
                        <button class="action-btn" type="button" data-action="edit" data-id="${user.id}" title="Edit account">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn" type="button" data-action="password" data-id="${user.id}" title="Reset password">
                            <i class="fa-solid fa-key"></i>
                        </button>
                        <button class="action-btn ${toggleClass}" type="button" data-action="toggle" data-id="${user.id}"
                            title="${toggleTitle}" ${isCurrentUser ? "disabled" : ""}>
                            <i class="fa-solid ${toggleIcon}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


function getInitials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2)
        .map(part => part.charAt(0).toUpperCase()).join("") || "ST";
}


function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* Staff form */

function openCreateModal() {
    elements.staffForm.reset();
    elements.staffId.value = "";
    elements.staffModalTitle.textContent = "Add Staff Member";
    elements.usernameGroup.hidden = false;
    elements.passwordGroup.hidden = false;
    elements.activeGroup.hidden = true;
    elements.username.required = true;
    elements.password.required = true;
    elements.role.value = "employee";
    elements.active.checked = true;
    openModal(elements.staffModal);
    elements.displayName.focus();
}


function openEditModal(userId) {
    const user = findUser(userId);
    if (!user) return;

    elements.staffForm.reset();
    elements.staffId.value = user.id;
    elements.staffModalTitle.textContent = "Edit Staff Account";
    elements.displayName.value = user.displayName;
    elements.role.value = user.role;
    elements.active.checked = user.isActive;
    elements.usernameGroup.hidden = true;
    elements.passwordGroup.hidden = true;
    elements.activeGroup.hidden = false;
    elements.username.required = false;
    elements.password.required = false;
    openModal(elements.staffModal);
    elements.displayName.focus();
}


async function saveStaff(event) {
    event.preventDefault();

    const userId = Number(elements.staffId.value);
    const displayName = elements.displayName.value.trim();
    if (!displayName) {
        showToast("Please enter the staff member's full name.", "error");
        elements.displayName.focus();
        return;
    }

    setButtonLoading(elements.saveStaffBtn, true);

    try {
        if (userId) {
            await apiRequest(`/staff/${userId}`, {
                method: "PUT",
                body: JSON.stringify({
                    displayName,
                    role: elements.role.value,
                    isActive: elements.active.checked
                })
            });
            showToast("Staff account updated.");
        } else {
            const username = elements.username.value.trim();
            const password = elements.password.value;

            if (!/^[A-Za-z0-9_.-]{3,80}$/.test(username)) {
                throw new Error("Enter a valid username with at least 3 characters.");
            }
            if (password.length < 8) {
                throw new Error("The temporary password must contain at least 8 characters.");
            }

            await apiRequest("/staff", {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password,
                    displayName,
                    role: elements.role.value
                })
            });
            showToast("New staff account created.");
        }

        closeModal(elements.staffModal);
        await loadStaff(false);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setButtonLoading(elements.saveStaffBtn, false);
    }
}


async function toggleAccount(userId) {
    const user = findUser(userId);
    if (!user) return;

    const action = user.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.displayName}'s account?`)) {
        return;
    }

    try {
        await apiRequest(`/staff/${user.id}`, {
            method: "PUT",
            body: JSON.stringify({
                displayName: user.displayName,
                role: user.role,
                isActive: !user.isActive
            })
        });
        showToast(`${user.displayName}'s account is now ${user.isActive ? "inactive" : "active"}.`);
        await loadStaff(false);
    } catch (error) {
        showToast(error.message, "error");
    }
}


/* Password reset */

function openPasswordModal(userId) {
    const user = findUser(userId);
    if (!user) return;

    elements.passwordForm.reset();
    elements.passwordStaffId.value = user.id;
    elements.passwordStaffName.textContent = user.displayName;
    openModal(elements.passwordModal);
    elements.newPassword.focus();
}


async function resetPassword(event) {
    event.preventDefault();

    const userId = Number(elements.passwordStaffId.value);
    const password = elements.newPassword.value;
    const confirmation = elements.confirmPassword.value;

    if (password.length < 8) {
        showToast("The new password must contain at least 8 characters.", "error");
        return;
    }
    if (password !== confirmation) {
        showToast("The passwords do not match.", "error");
        elements.confirmPassword.focus();
        return;
    }

    setButtonLoading(elements.resetPasswordBtn, true);
    try {
        const result = await apiRequest(`/staff/${userId}/password`, {
            method: "PATCH",
            body: JSON.stringify({ password })
        });
        closeModal(elements.passwordModal);
        showToast(result?.message || "Password reset successfully.");
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setButtonLoading(elements.resetPasswordBtn, false);
    }
}


/* UI helpers */

function findUser(userId) {
    return staffUsers.find(user => user.id === Number(userId));
}


function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
}


function closeModal(modal) {
    modal.hidden = true;
    if (elements.staffModal.hidden && elements.passwordModal.hidden) {
        document.body.style.overflow = "";
    }
}


function setButtonLoading(button, loading) {
    button.disabled = loading;
    button.querySelector("i")?.classList.toggle("fa-spin", loading);
}


function showToast(message, type = "success") {
    window.clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.toast.classList.toggle("error", type === "error");
    const icon = elements.toast.querySelector("i");
    icon.className = type === "error"
        ? "fa-solid fa-circle-exclamation"
        : "fa-solid fa-circle-check";
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 3500);
}


function togglePassword(button) {
    const input = document.getElementById(button.dataset.passwordTarget);
    if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.querySelector("i").className = showing
        ? "fa-regular fa-eye"
        : "fa-regular fa-eye-slash";
}


function openSidebar() {
    elements.sidebar.classList.add("open");
    elements.mobileOverlay.classList.add("show");
}


function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.mobileOverlay.classList.remove("show");
}


function logout() {
    clearStaffSession();
    window.location.replace("role-selection.html");
}


function handleTableAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;

    const userId = Number(button.dataset.id);
    if (button.dataset.action === "edit") openEditModal(userId);
    if (button.dataset.action === "password") openPasswordModal(userId);
    if (button.dataset.action === "toggle") toggleAccount(userId);
}


function initializeEvents() {
    elements.openAddBtn.addEventListener("click", openCreateModal);
    elements.refreshBtn.addEventListener("click", () => loadStaff(true));
    elements.staffForm.addEventListener("submit", saveStaff);
    elements.passwordForm.addEventListener("submit", resetPassword);
    elements.tableBody.addEventListener("click", handleTableAction);
    elements.search.addEventListener("input", renderTable);
    elements.roleFilter.addEventListener("change", renderTable);
    elements.statusFilter.addEventListener("change", renderTable);
    elements.logoutBtn.addEventListener("click", logout);
    elements.menuToggle.addEventListener("click", openSidebar);
    elements.mobileOverlay.addEventListener("click", closeSidebar);

    document.querySelectorAll("[data-close='staff']").forEach(button => {
        button.addEventListener("click", () => closeModal(elements.staffModal));
    });
    document.querySelectorAll("[data-close='password']").forEach(button => {
        button.addEventListener("click", () => closeModal(elements.passwordModal));
    });
    document.querySelectorAll("[data-password-target]").forEach(button => {
        button.addEventListener("click", () => togglePassword(button));
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        closeModal(elements.staffModal);
        closeModal(elements.passwordModal);
        closeSidebar();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeSidebar();
    });
}


async function initializePage() {
    if (!checkAdminAccess()) return;
    elements.sidebarUsername.textContent =
        getStoredValue("displayName") || getStoredValue("loggedInUser") || "Administrator";
    initializeEvents();
    await loadStaff(false);
}


document.addEventListener("DOMContentLoaded", initializePage);
