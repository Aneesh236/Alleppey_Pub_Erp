"use strict";

let auditLogs = [];
let toastTimer = null;

const elements = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("mobileOverlay"),
    menuToggle: document.getElementById("menuToggle"),
    sidebarUsername: document.getElementById("sidebarUsername"),
    logoutBtn: document.getElementById("logoutBtn"),
    refreshBtn: document.getElementById("refreshLogsBtn"),
    totalEvents: document.getElementById("totalEvents"),
    todayEvents: document.getElementById("todayEvents"),
    activeActors: document.getElementById("activeActors"),
    deleteEvents: document.getElementById("deleteEvents"),
    resultCount: document.getElementById("resultCount"),
    search: document.getElementById("logSearch"),
    entityFilter: document.getElementById("entityFilter"),
    actionFilter: document.getElementById("actionFilter"),
    timeline: document.getElementById("auditTimeline"),
    emptyState: document.getElementById("emptyState"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage")
};

function stored(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

function clearSession() {
    const keys = ["authToken", "loggedInUser", "displayName", "userRole", "isLoggedIn", "adminLoggedIn", "employeeLoggedIn", "authExpiresAt"];
    [localStorage, sessionStorage].forEach(storage => keys.forEach(key => storage.removeItem(key)));
}

function redirectToLogin() {
    clearSession();
    window.location.replace("role-selection.html");
}

function checkAccess() {
    const loggedIn = localStorage.getItem("adminLoggedIn") === "true" || sessionStorage.getItem("adminLoggedIn") === "true";
    if (stored("userRole") !== "admin" || !loggedIn || !stored("authToken")) {
        redirectToLogin();
        return false;
    }
    return true;
}

function apiBaseUrl() {
    const url = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");
    if (!url) throw new Error("The backend URL is missing from config.js.");
    return url;
}

async function apiRequest(path) {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${stored("authToken")}` }
    });
    let result = null;
    try { result = await response.json(); } catch (error) { console.error("Unreadable server response.", error); }
    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error("Your admin session expired. Please log in again.");
    }
    if (!response.ok) throw new Error(result?.detail || `Server error ${response.status}`);
    return result;
}

function normalize(log) {
    return {
        id: Number(log.id),
        actorUsername: String(log.actorUsername || "System"),
        actorRole: String(log.actorRole || "system").toLowerCase(),
        action: String(log.action || "Updated"),
        entityType: String(log.entityType || "ERP"),
        entityId: String(log.entityId || ""),
        details: String(log.details || "No additional details."),
        createdAt: String(log.createdAt || "")
    };
}

async function loadLogs(showSuccess = false) {
    setLoading(true);
    elements.resultCount.textContent = "Loading audit events...";
    try {
        const result = await apiRequest("/audit-logs");
        auditLogs = Array.isArray(result) ? result.map(normalize) : [];
        populateFilters();
        render();
        if (showSuccess) showToast("Audit trail refreshed.");
    } catch (error) {
        elements.resultCount.textContent = "Audit events could not be loaded.";
        showToast(error.message, "error");
    } finally {
        setLoading(false);
    }
}

function populateFilters() {
    const currentEntity = elements.entityFilter.value;
    const currentAction = elements.actionFilter.value;
    const entities = [...new Set(auditLogs.map(log => log.entityType))].sort();
    const actions = [...new Set(auditLogs.map(log => log.action))].sort();
    elements.entityFilter.innerHTML = '<option value="all">All areas</option>' + entities.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    elements.actionFilter.innerHTML = '<option value="all">All actions</option>' + actions.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    if (entities.includes(currentEntity)) elements.entityFilter.value = currentEntity;
    if (actions.includes(currentAction)) elements.actionFilter.value = currentAction;
}

function filteredLogs() {
    const query = elements.search.value.trim().toLowerCase();
    return auditLogs.filter(log => {
        const text = `${log.actorUsername} ${log.action} ${log.entityType} ${log.entityId} ${log.details}`.toLowerCase();
        return (!query || text.includes(query)) &&
            (elements.entityFilter.value === "all" || log.entityType === elements.entityFilter.value) &&
            (elements.actionFilter.value === "all" || log.action === elements.actionFilter.value);
    });
}

function render() {
    const logs = filteredLogs();
    const today = new Date().toDateString();
    elements.totalEvents.textContent = auditLogs.length;
    elements.todayEvents.textContent = auditLogs.filter(log => new Date(log.createdAt).toDateString() === today).length;
    elements.activeActors.textContent = new Set(auditLogs.map(log => log.actorUsername)).size;
    elements.deleteEvents.textContent = auditLogs.filter(log => log.action.toLowerCase() === "deleted").length;
    elements.resultCount.textContent = `${logs.length} of ${auditLogs.length} events shown`;
    elements.emptyState.hidden = logs.length > 0;
    elements.timeline.innerHTML = logs.map(logTemplate).join("");
}

function logTemplate(log) {
    const style = iconStyle(log.action, log.entityType);
    const date = new Date(log.createdAt);
    const validDate = !Number.isNaN(date.getTime());
    const dateText = validDate ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "Unknown date";
    const timeText = validDate ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(date) : "";
    const reference = log.entityId ? ` · #${escapeHtml(log.entityId)}` : "";
    return `<article class="log-row">
        <span class="log-icon ${style.className}"><i class="fa-solid ${style.icon}"></i></span>
        <div class="log-main">
            <div class="log-title"><strong>${escapeHtml(log.entityType)}${reference}</strong><span class="action-badge">${escapeHtml(log.action)}</span></div>
            <p class="log-details">${escapeHtml(log.details)}</p>
            <div class="log-meta"><i class="fa-solid fa-user"></i><span>@${escapeHtml(log.actorUsername)}</span><span class="role-badge ${log.actorRole}">${escapeHtml(log.actorRole)}</span></div>
        </div>
        <time class="log-time" datetime="${escapeHtml(log.createdAt)}"><strong>${dateText}</strong>${timeText}</time>
    </article>`;
}

function iconStyle(action, entity) {
    const value = `${action} ${entity}`.toLowerCase();
    if (value.includes("deleted")) return { icon: "fa-trash-can", className: "deleted" };
    if (value.includes("created")) return { icon: "fa-plus", className: "created" };
    if (value.includes("password") || value.includes("staff")) return { icon: "fa-shield-halved", className: "security" };
    if (value.includes("order")) return { icon: "fa-receipt", className: "" };
    if (value.includes("inventory")) return { icon: "fa-boxes-stacked", className: "" };
    if (value.includes("bill")) return { icon: "fa-file-invoice-dollar", className: "" };
    return { icon: "fa-pen", className: "" };
}

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setLoading(loading) {
    elements.refreshBtn.disabled = loading;
    elements.refreshBtn.querySelector("i")?.classList.toggle("fa-spin", loading);
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.toast.classList.toggle("error", type === "error");
    elements.toast.querySelector("i").className = type === "error" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3500);
}

function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.overlay.classList.remove("show");
}

function initializeEvents() {
    elements.refreshBtn.addEventListener("click", () => loadLogs(true));
    elements.search.addEventListener("input", render);
    elements.entityFilter.addEventListener("change", render);
    elements.actionFilter.addEventListener("change", render);
    elements.logoutBtn.addEventListener("click", redirectToLogin);
    elements.menuToggle.addEventListener("click", () => { elements.sidebar.classList.add("open"); elements.overlay.classList.add("show"); });
    elements.overlay.addEventListener("click", closeSidebar);
    window.addEventListener("resize", () => { if (window.innerWidth > 900) closeSidebar(); });
}

async function initializePage() {
    if (!checkAccess()) return;
    elements.sidebarUsername.textContent = stored("displayName") || stored("loggedInUser") || "Administrator";
    initializeEvents();
    await loadLogs(false);
}

document.addEventListener("DOMContentLoaded", initializePage);
