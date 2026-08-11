"use strict";

/* Alleppey Pub ERP - live database admin dashboard. */

const DASHBOARD_REFRESH_INTERVAL = 30000;
const CACHE_KEYS = {
    orders: "pubOrders",
    inventory: "pubInventory",
    menu: "pubMenu"
};

let dashboardData = {
    orders: [],
    inventory: [],
    menu: [],
    usingCachedData: true,
    lastUpdated: null
};

let toastTimer = null;
let dashboardTimer = null;

const elements = {
    sidebar: document.getElementById("sidebar"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    menuToggle: document.getElementById("menuToggle"),
    welcomeHeading: document.getElementById("welcomeHeading"),
    sidebarUsername: document.getElementById("sidebarUsername"),
    liveClock: document.getElementById("liveClock"),
    totalRevenue: document.getElementById("totalRevenue"),
    totalOrders: document.getElementById("totalOrders"),
    pendingOrders: document.getElementById("pendingOrders"),
    lowStockTotal: document.getElementById("lowStockTotal"),
    availableMenuItems: document.getElementById("availableMenuItems"),
    revenueDescription: document.getElementById("revenueDescription"),
    ordersDescription: document.getElementById("ordersDescription"),
    sidebarOrderCount: document.getElementById("sidebarOrderCount"),
    sidebarStockCount: document.getElementById("sidebarStockCount"),
    notificationCount: document.getElementById("notificationCount"),
    salesChartBars: document.getElementById("salesChartBars"),
    recentOrdersBody: document.getElementById("recentOrdersBody"),
    ordersEmptyState: document.getElementById("ordersEmptyState"),
    inventoryAlertList: document.getElementById("inventoryAlertList"),
    inventoryEmptyState: document.getElementById("inventoryEmptyState"),
    popularItemsList: document.getElementById("popularItemsList"),
    popularItemsEmptyState: document.getElementById("popularItemsEmptyState"),
    refreshDashboardBtn: document.getElementById("refreshDashboardBtn"),
    notificationBtn: document.getElementById("notificationBtn"),
    printDashboardBtn: document.getElementById("printDashboardBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    dataMode: document.getElementById("dataMode"),
    toast: document.getElementById("toast")
};


/* API */

function getApiBaseUrl() {
    const apiBaseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");

    if (!apiBaseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return apiBaseUrl;
}


async function apiRequest(path) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        console.error("The server returned an unreadable response.", error);
    }

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            `Server error ${response.status}`
        );
    }

    return Array.isArray(result) ? result : [];
}


async function refreshDashboardFromApi(showMessage = true) {
    elements.refreshDashboardBtn.disabled = true;
    elements.refreshDashboardBtn.classList.add("loading");

    try {
        const [orders, inventory, menu] = await Promise.all([
            apiRequest("/orders"),
            apiRequest("/inventory"),
            apiRequest("/menu")
        ]);

        dashboardData = {
            orders,
            inventory,
            menu,
            usingCachedData: false,
            lastUpdated: new Date()
        };

        cacheDashboardData();
        renderDashboard();

        if (showMessage) {
            showToast("Dashboard refreshed from the database.");
        }

        return true;
    } catch (error) {
        console.error("Could not refresh the dashboard.", error);
        dashboardData.usingCachedData = true;
        renderDataMode();

        if (showMessage) {
            showToast(
                `${error.message || "Backend unavailable."} Showing saved dashboard data.`
            );
        }

        return false;
    } finally {
        elements.refreshDashboardBtn.disabled = false;
        elements.refreshDashboardBtn.classList.remove("loading");
    }
}


/* Cache */

function readCachedArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn(`Could not read ${key}.`, error);
        return [];
    }
}


function loadCachedDashboardData() {
    dashboardData = {
        orders: readCachedArray(CACHE_KEYS.orders),
        inventory: readCachedArray(CACHE_KEYS.inventory),
        menu: readCachedArray(CACHE_KEYS.menu),
        usingCachedData: true,
        lastUpdated: null
    };
}


function cacheDashboardData() {
    localStorage.setItem(CACHE_KEYS.orders, JSON.stringify(dashboardData.orders));
    localStorage.setItem(CACHE_KEYS.inventory, JSON.stringify(dashboardData.inventory));
    localStorage.setItem(CACHE_KEYS.menu, JSON.stringify(dashboardData.menu));
}


/* Data helpers */

function getText(...values) {
    const result = values.find(
        (value) => typeof value === "string" && value.trim()
    );
    return result ? result.trim() : "";
}


function getNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const number = Number(String(value || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(number) ? number : 0;
}


function getItems(record) {
    const items = record.items || record.orderItems || record.cart || [];
    return Array.isArray(items) ? items : [];
}


function getRecordTotal(record) {
    const total = getNumber(
        record.total ?? record.grandTotal ?? record.amount ?? record.totalAmount
    );

    if (total > 0) return total;

    return getItems(record).reduce((sum, item) => {
        const quantity = Math.max(1, getNumber(item.quantity ?? item.qty ?? 1));
        const price = getNumber(item.price ?? item.unitPrice ?? item.rate);
        return sum + quantity * price;
    }, 0);
}


function getStatus(record) {
    return getText(record.status, record.orderStatus) || "Pending";
}


function getRecordDate(record) {
    const value = record.createdAt || record.date || record.orderDate;
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}


function isCompletedOrder(order) {
    const status = getStatus(order).toLowerCase();
    return status.includes("complete") || status.includes("served");
}


function getOpenOrders() {
    return dashboardData.orders.filter((order) => {
        const status = getStatus(order).toLowerCase();
        return ["pending", "preparing", "ready"].some(
            (openStatus) => status.includes(openStatus)
        );
    });
}


function getLowStockItems() {
    return dashboardData.inventory.filter((item) => {
        const currentStock = getNumber(item.currentStock ?? item.current_stock);
        const minimumStock = getNumber(item.minimumStock ?? item.minimum_stock);
        return currentStock <= 0 || (minimumStock > 0 && currentStock <= minimumStock);
    });
}


function getAvailableMenuItems() {
    return dashboardData.menu.filter(
        (item) => getStatus(item).toLowerCase() === "available"
    );
}


function formatMoney(value, compact = false) {
    if (compact && value >= 1000) {
        return `â‚¹${new Intl.NumberFormat("en-IN", {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(value)}`;
    }

    return `â‚¹${Math.round(value).toLocaleString("en-IN")}`;
}


function animateNumber(element, target, formatter = (value) => String(value)) {
    const safeTarget = Math.max(0, Number(target) || 0);
    const duration = 550;
    const startTime = performance.now();

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentValue = safeTarget * (1 - Math.pow(1 - progress, 3));
        element.textContent = formatter(currentValue);

        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}


/* Render dashboard */

function renderSummary() {
    const completedOrders = dashboardData.orders.filter(isCompletedOrder);
    const revenue = completedOrders.reduce(
        (total, order) => total + getRecordTotal(order),
        0
    );
    const openOrders = getOpenOrders();
    const lowStockItems = getLowStockItems();
    const availableMenuItems = getAvailableMenuItems();

    animateNumber(elements.totalRevenue, revenue, (value) => formatMoney(value));
    animateNumber(elements.totalOrders, dashboardData.orders.length, (value) => String(Math.round(value)));
    animateNumber(elements.pendingOrders, openOrders.length, (value) => String(Math.round(value)));
    animateNumber(elements.lowStockTotal, lowStockItems.length, (value) => String(Math.round(value)));
    animateNumber(elements.availableMenuItems, availableMenuItems.length, (value) => String(Math.round(value)));

    elements.revenueDescription.textContent =
        `From ${completedOrders.length} completed order${completedOrders.length === 1 ? "" : "s"}`;

    elements.ordersDescription.textContent =
        `${completedOrders.length} completed Â· ${openOrders.length} open`;

    elements.sidebarOrderCount.textContent = String(openOrders.length);
    elements.sidebarStockCount.textContent = String(lowStockItems.length);

    const alertCount = openOrders.length + lowStockItems.length;
    elements.notificationCount.textContent = String(alertCount);
    elements.notificationCount.dataset.count = String(alertCount);
}


function renderSalesChart() {
    elements.salesChartBars.replaceChildren();

    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        days.push({
            date,
            label: date.toLocaleDateString("en-IN", { weekday: "short" }),
            total: 0
        });
    }

    dashboardData.orders.filter(isCompletedOrder).forEach((order) => {
        const orderDate = getRecordDate(order);
        if (!orderDate) return;
        orderDate.setHours(0, 0, 0, 0);

        const day = days.find((entry) => entry.date.getTime() === orderDate.getTime());
        if (day) day.total += getRecordTotal(order);
    });

    const maximum = Math.max(...days.map((day) => day.total), 1);

    days.forEach((day) => {
        const column = document.createElement("div");
        column.className = "chart-column";

        const value = document.createElement("span");
        value.className = "chart-value";
        value.textContent = formatMoney(day.total, true);

        const track = document.createElement("div");
        track.className = "chart-track";
        track.title = `${day.label}: ${formatMoney(day.total)}`;

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = `${Math.max(day.total ? 7 : 2, (day.total / maximum) * 100)}%`;

        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = day.label;

        track.appendChild(bar);
        column.append(value, track, label);
        elements.salesChartBars.appendChild(column);
    });
}


function renderRecentOrders() {
    elements.recentOrdersBody.replaceChildren();

    const recentOrders = [...dashboardData.orders]
        .sort((first, second) => {
            return (getRecordDate(second)?.getTime() || 0) -
                (getRecordDate(first)?.getTime() || 0);
        })
        .slice(0, 5);

    elements.ordersEmptyState.classList.toggle("show", recentOrders.length === 0);

    recentOrders.forEach((order, index) => {
        const row = document.createElement("tr");
        const status = getStatus(order);
        const orderId = String(order.id || order.orderId || `ORD-${index + 1}`);
        const type = getText(order.orderType, order.type) ||
            (order.table ? `Table ${order.table}` : "Dine In");

        [
            orderId.startsWith("#") ? orderId : `#${orderId}`,
            getText(order.customer, order.customerName) || "Walk-in Customer",
            type
        ].forEach((text) => {
            const cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`;
        badge.textContent = status;
        statusCell.appendChild(badge);

        const totalCell = document.createElement("td");
        totalCell.textContent = formatMoney(getRecordTotal(order));

        row.append(statusCell, totalCell);
        elements.recentOrdersBody.appendChild(row);
    });
}


function renderInventoryAlerts() {
    elements.inventoryAlertList.replaceChildren();

    const lowItems = getLowStockItems()
        .sort((first, second) => getNumber(first.currentStock) - getNumber(second.currentStock))
        .slice(0, 4);

    elements.inventoryEmptyState.classList.toggle("show", lowItems.length === 0);

    lowItems.forEach((item) => {
        const currentStock = getNumber(item.currentStock ?? item.current_stock);
        const minimumStock = getNumber(item.minimumStock ?? item.minimum_stock);
        const unit = getText(item.unit) || "units";

        const container = document.createElement("div");
        container.className = "inventory-alert-item";

        const icon = document.createElement("i");
        icon.className = currentStock <= 0
            ? "fa-solid fa-circle-xmark"
            : "fa-solid fa-triangle-exclamation";

        const copy = document.createElement("div");
        const name = document.createElement("strong");
        const detail = document.createElement("small");
        name.textContent = getText(item.name) || "Inventory Item";
        detail.textContent = `Reorder level: ${minimumStock} ${unit}`;
        copy.append(name, detail);

        const quantity = document.createElement("span");
        quantity.className = "stock-quantity";
        quantity.textContent = currentStock <= 0
            ? "Out of stock"
            : `${currentStock} ${unit}`;

        container.append(icon, copy, quantity);
        elements.inventoryAlertList.appendChild(container);
    });
}


function renderPopularItems() {
    elements.popularItemsList.replaceChildren();
    const totals = new Map();

    dashboardData.orders.forEach((order) => {
        getItems(order).forEach((item) => {
            const name = getText(item.name, item.itemName) || "Item";
            const quantity = Math.max(1, getNumber(item.quantity ?? item.qty ?? 1));
            totals.set(name, (totals.get(name) || 0) + quantity);
        });
    });

    const popularItems = [...totals.entries()]
        .sort((first, second) => second[1] - first[1])
        .slice(0, 4);

    elements.popularItemsEmptyState.classList.toggle("show", popularItems.length === 0);

    popularItems.forEach(([name, quantity], index) => {
        const container = document.createElement("div");
        container.className = "popular-item";

        const rank = document.createElement("span");
        rank.className = "popular-rank";
        rank.textContent = String(index + 1);

        const copy = document.createElement("div");
        const itemName = document.createElement("strong");
        const detail = document.createElement("small");
        itemName.textContent = name;
        detail.textContent = index === 0 ? "Current top seller" : "Popular menu item";
        copy.append(itemName, detail);

        const count = document.createElement("span");
        count.className = "popular-count";
        count.textContent = `${quantity} sold`;

        container.append(rank, copy, count);
        elements.popularItemsList.appendChild(container);
    });
}


function renderUserDetails() {
    const username = localStorage.getItem("loggedInUser") || "Administrator";
    const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1);
    elements.welcomeHeading.textContent = `Welcome back, ${formattedUsername}`;
    elements.sidebarUsername.textContent = formattedUsername;
}


function renderDataMode() {
    elements.dataMode.classList.add("show");
    elements.dataMode.classList.toggle("error", dashboardData.usingCachedData);

    const statusText = dashboardData.usingCachedData
        ? "Backend unavailable Â· showing saved browser data"
        : `Live database data Â· updated ${dashboardData.lastUpdated.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })}`;

    elements.dataMode.querySelector("span").textContent = statusText;
}


function renderDashboard() {
    renderUserDetails();
    renderSummary();
    renderSalesChart();
    renderRecentOrders();
    renderInventoryAlerts();
    renderPopularItems();
    renderDataMode();
}


/* Interface */

function updateClock() {
    elements.liveClock.textContent = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2700);
}


function openSidebar() {
    elements.sidebar.classList.add("open");
    elements.mobileOverlay.classList.add("show");
    elements.menuToggle.setAttribute("aria-expanded", "true");
}


function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.mobileOverlay.classList.remove("show");
    elements.menuToggle.setAttribute("aria-expanded", "false");
}


function initializeEvents() {
    elements.menuToggle.addEventListener("click", () => {
        elements.sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
    });

    elements.mobileOverlay.addEventListener("click", closeSidebar);
    document.querySelectorAll(".sidebar .nav-link").forEach(
        (link) => link.addEventListener("click", closeSidebar)
    );

    elements.refreshDashboardBtn.addEventListener(
        "click",
        () => refreshDashboardFromApi(true)
    );

    elements.notificationBtn.addEventListener("click", () => {
        const lowStock = getLowStockItems().length;
        const openOrders = getOpenOrders().length;

        if (!lowStock && !openOrders) {
            showToast("No urgent dashboard alerts.");
            return;
        }

        showToast(
            `${openOrders} open order${openOrders === 1 ? "" : "s"} and ` +
            `${lowStock} stock alert${lowStock === 1 ? "" : "s"}.`
        );
    });

    elements.printDashboardBtn.addEventListener("click", () => window.print());

    elements.logoutBtn.addEventListener("click", () => {
        if (!window.confirm("Are you sure you want to log out?")) return;

        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("adminLoggedIn");
        showToast("Logging out...");

        window.setTimeout(() => {
            window.location.href = "login.html";
        }, 700);
    });

    window.addEventListener("storage", () => {
        loadCachedDashboardData();
        renderDashboard();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeSidebar();
    });

    window.addEventListener("focus", () => refreshDashboardFromApi(false));
}


function checkAccess() {
    const role = localStorage.getItem("userRole");
    if (role && role !== "admin") window.location.href = "login.html";
}


function startAutomaticRefresh() {
    window.clearInterval(dashboardTimer);
    dashboardTimer = window.setInterval(() => {
        if (!document.hidden) refreshDashboardFromApi(false);
    }, DASHBOARD_REFRESH_INTERVAL);
}


async function initializeDashboard() {
    checkAccess();
    loadCachedDashboardData();
    renderDashboard();
    initializeEvents();
    updateClock();
    window.setInterval(updateClock, 1000);
    await refreshDashboardFromApi(false);
    startAutomaticRefresh();
}


document.addEventListener("DOMContentLoaded", initializeDashboard);