"use strict";

/* Alleppey Pub ERP - live employee dashboard */

const ORDER_CACHE_KEY = "pubOrders";
const REFRESH_INTERVAL = 20000;
const STATUS_OPTIONS = ["Pending", "Preparing", "Ready", "Completed"];

let orders = [];
let toastTimer = null;

const elements = {
    liveClock: document.getElementById("liveClock"),
    ordersTable: document.getElementById("ordersTable"),
    refreshButton: document.querySelector(".refresh-btn"),
    logoutButton: document.getElementById("logoutBtn"),
    sidebarLogoutButton: document.getElementById("sidebarLogoutBtn"),
    newOrderButton: document.getElementById("newOrderBtn"),
    printButton: document.getElementById("printBtn"),
    viewOrdersButton: document.getElementById("viewOrdersBtn"),
    employeeName: document.getElementById("employeeName"),
    welcomeMessage: document.getElementById("welcomeMessage"),
    pendingCount: document.getElementById("pendingCount"),
    preparingCount: document.getElementById("preparingCount"),
    readyCount: document.getElementById("readyCount"),
    occupiedCount: document.getElementById("occupiedCount"),
    activityList: document.getElementById("activityList"),
    dataStatus: document.getElementById("dataStatus"),
    toast: document.getElementById("toast")
};


/* EMPLOYEE ACCESS */

function checkEmployeeAccess() {
    const role = localStorage.getItem("userRole") ||
        sessionStorage.getItem("userRole");
    const loggedIn =
        localStorage.getItem("employeeLoggedIn") === "true" ||
        sessionStorage.getItem("employeeLoggedIn") === "true";

    if (role !== "employee" || !loggedIn || !getAuthToken()) {
        endStaffSession();
        return false;
    }

    return true;
}


/* API */

function getApiBaseUrl() {
    const baseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");

    if (!baseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return baseUrl;
}

function getAuthToken() {
    return localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") || "";
}

function endStaffSession() {
    [localStorage, sessionStorage].forEach(storage => {
        [
            "authToken", "loggedInUser", "displayName", "userRole",
            "isLoggedIn", "adminLoggedIn", "employeeLoggedIn", "authExpiresAt"
        ].forEach(key => storage.removeItem(key));
    });
    window.location.replace("role-selection.html");
}

async function apiRequest(path, options = {}) {
    const token = getAuthToken();
    if (!token) {
        endStaffSession();
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

    try {
        result = await response.json();
    } catch (error) {
        if (response.status !== 204) {
            console.error("The server response could not be read.", error);
        }
    }

    if (response.status === 401 || response.status === 403) {
        endStaffSession();
        throw new Error("Your staff session expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(result?.detail || `Server error ${response.status}`);
    }

    return result;
}

async function refreshOrders(showMessage = true) {
    setRefreshLoading(true);

    try {
        const result = await apiRequest("/orders");
        orders = Array.isArray(result) ? result.map(normalizeOrder) : [];
        localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(orders));
        renderDashboard();
        showDataStatus(false);

        if (showMessage) {
            showToast("Orders refreshed from the database.", "success");
        }
    } catch (error) {
        console.error("Could not load live orders.", error);
        orders = loadCachedOrders();
        renderDashboard();
        showDataStatus(true);

        if (showMessage) {
            showToast("Server unavailable. Showing saved orders.", "error");
        }
    } finally {
        setRefreshLoading(false);
    }
}

async function updateOrderStatus(orderId, status, selectElement) {
    selectElement.disabled = true;

    try {
        const updatedOrder = await apiRequest(
            `/orders/${encodeURIComponent(orderId)}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ status })
            }
        );

        orders = orders.map(order =>
            order.id === orderId ? normalizeOrder(updatedOrder) : order
        );

        localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(orders));
        renderDashboard();
        showToast(`${orderId} changed to ${status}.`, "success");
    } catch (error) {
        console.error("Could not update order status.", error);
        renderOrders();
        showToast(error.message || "Could not update the order.", "error");
    }
}


/* DATA */

function loadCachedOrders() {
    try {
        const savedOrders = JSON.parse(localStorage.getItem(ORDER_CACHE_KEY));
        return Array.isArray(savedOrders) ? savedOrders.map(normalizeOrder) : [];
    } catch (error) {
        console.warn("Saved orders could not be read.", error);
        return [];
    }
}

function normalizeOrder(order, index = 0) {
    const total = Number(order?.total ?? order?.grandTotal ?? 0);
    const items = Array.isArray(order?.items) ? order.items : [];

    return {
        ...order,
        id: String(order?.id || order?.orderId || `ORDER-${index + 1}`),
        table: String(order?.table || order?.tableNumber || "Takeaway"),
        customer: String(order?.customer || order?.customerName || "Walk-in Customer"),
        status: String(order?.status || "Pending"),
        total: Number.isFinite(total) ? total : 0,
        items,
        itemCount: Number(order?.itemCount) || items.reduce(
            (sum, item) => sum + (Number(item.qty ?? item.quantity) || 0),
            0
        ),
        createdAt: order?.createdAt || order?.date || ""
    };
}

function normalizeStatus(status) {
    return String(status || "").trim().toLowerCase();
}

function isActiveOrder(order) {
    return !["completed", "cancelled"].includes(normalizeStatus(order.status));
}


/* RENDERING */

function renderDashboard() {
    renderOrders();
    renderStatistics();
    renderActivity();
}

function renderOrders() {
    const activeOrders = orders.filter(isActiveOrder);

    if (!activeOrders.length) {
        elements.ordersTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-orders">
                    No active orders are waiting right now.
                </td>
            </tr>
        `;
        return;
    }

    elements.ordersTable.innerHTML = activeOrders
        .slice(0, 10)
        .map(order => {
            const status = normalizeStatus(order.status);
            const options = STATUS_OPTIONS.map(option => `
                <option value="${option}" ${normalizeStatus(option) === status ? "selected" : ""}>
                    ${option}
                </option>
            `).join("");

            return `
                <tr>
                    <td><strong>${escapeHTML(order.id)}</strong></td>
                    <td>${escapeHTML(formatTable(order.table))}</td>
                    <td>${escapeHTML(order.customer)}</td>
                    <td>${escapeHTML(formatItemCount(order.itemCount))}</td>
                    <td>
                        <select class="status-select ${getStatusClass(order.status)}"
                                data-order-id="${escapeAttribute(order.id)}"
                                aria-label="Change status for ${escapeAttribute(order.id)}">
                            ${options}
                        </select>
                    </td>
                    <td>${formatMoney(order.total)}</td>
                </tr>
            `;
        })
        .join("");
}

function renderStatistics() {
    const countStatus = status => orders.filter(
        order => normalizeStatus(order.status) === status
    ).length;

    const occupiedTables = new Set(
        orders
            .filter(isActiveOrder)
            .map(order => String(order.table).trim())
            .filter(table => table && !/takeaway/i.test(table))
    ).size;

    elements.pendingCount.textContent = countStatus("pending");
    elements.preparingCount.textContent = countStatus("preparing");
    elements.readyCount.textContent = countStatus("ready");
    elements.occupiedCount.textContent = occupiedTables;
}

function renderActivity() {
    const recentOrders = [...orders]
        .sort((a, b) => getOrderTime(b) - getOrderTime(a))
        .slice(0, 5);

    if (!recentOrders.length) {
        elements.activityList.innerHTML = `
            <li class="empty-activity">
                <i class="fa-solid fa-clock"></i>
                No recent order activity.
            </li>
        `;
        return;
    }

    elements.activityList.innerHTML = recentOrders.map(order => `
        <li>
            <i class="fa-solid ${getActivityIcon(order.status)}"></i>
            <span>
                <strong>${escapeHTML(order.id)}</strong> is ${escapeHTML(order.status)}
                <small>${escapeHTML(formatOrderTime(order.createdAt))}</small>
            </span>
        </li>
    `).join("");
}

function showDataStatus(usingCache) {
    if (usingCache) {
        elements.dataStatus.textContent = "Saved data - backend currently unavailable";
        elements.dataStatus.classList.add("offline");
        return;
    }

    const time = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    elements.dataStatus.textContent = `Live database - updated ${time}`;
    elements.dataStatus.classList.remove("offline");
}


/* PROFILE, CLOCK AND HELPERS */

function loadEmployeeProfile() {
    const username =
        localStorage.getItem("loggedInUser") ||
        sessionStorage.getItem("loggedInUser") ||
        "Employee";

    const name = formatEmployeeName(username);
    elements.employeeName.textContent = name;
    elements.welcomeMessage.textContent = `Welcome back, ${name}! Have a productive shift.`;
}

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
    });
    const date = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata"
    });

    elements.liveClock.innerHTML = `<div>${time}</div><small>${date}</small>`;
}

function formatEmployeeName(username) {
    return String(username)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatTable(table) {
    const value = String(table || "");
    return /^\d+$/.test(value) ? `Table ${value}` : value;
}

function formatItemCount(count) {
    const number = Number(count) || 0;
    return `${number} item${number === 1 ? "" : "s"}`;
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function formatOrderTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently added";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getOrderTime(order) {
    const time = new Date(order.createdAt).getTime();
    return Number.isFinite(time) ? time : 0;
}

function getStatusClass(status) {
    const normalized = normalizeStatus(status);
    return ["pending", "preparing", "ready", "completed"].includes(normalized)
        ? normalized
        : "pending";
}

function getActivityIcon(status) {
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "fa-circle-check";
    if (normalized === "ready") return "fa-bell-concierge";
    if (normalized === "preparing") return "fa-fire-burner";
    return "fa-clock";
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

function escapeAttribute(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function setRefreshLoading(isLoading) {
    elements.refreshButton.disabled = isLoading;
    elements.refreshButton.querySelector("i")?.classList.toggle("fa-spin", isLoading);
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2600);
}


/* EVENTS */

function logout() {
    ["authToken", "loggedInUser", "displayName", "userRole", "isLoggedIn", "employeeLoggedIn", "authExpiresAt"].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    window.location.href = "role-selection.html";
}

function initializeEvents() {
    elements.refreshButton.addEventListener("click", () => refreshOrders(true));
    elements.logoutButton.addEventListener("click", logout);
    elements.sidebarLogoutButton.addEventListener("click", event => {
        event.preventDefault();
        logout();
    });
    elements.newOrderButton.addEventListener("click", () => {
        window.location.href = "menu.html";
    });
    elements.printButton.addEventListener("click", () => {
        window.location.href = "billing-pos.html";
    });
    elements.viewOrdersButton.addEventListener("click", () => {
        document.getElementById("liveOrders").scrollIntoView({ behavior: "smooth" });
    });
    elements.ordersTable.addEventListener("change", event => {
        const select = event.target.closest(".status-select");
        if (select) {
            updateOrderStatus(select.dataset.orderId, select.value, select);
        }
    });
    window.addEventListener("storage", event => {
        if (event.key === ORDER_CACHE_KEY) {
            orders = loadCachedOrders();
            renderDashboard();
        }
    });
}

async function initializeDashboard() {
    if (!checkEmployeeAccess()) return;

    orders = loadCachedOrders();
    loadEmployeeProfile();
    updateClock();
    renderDashboard();
    initializeEvents();

    window.setInterval(updateClock, 1000);
    await refreshOrders(false);

    window.setInterval(() => {
        if (!document.hidden) refreshOrders(false);
    }, REFRESH_INTERVAL);
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
