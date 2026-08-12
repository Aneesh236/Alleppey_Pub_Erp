"use strict";

// Different pages in the ERP may use different localStorage names.
// This page reads all of them, combines the orders, and removes duplicates.
const ORDER_LIST_KEYS = [
    "orders",
    "pubOrders",
    "restaurantOrders",
    "orderHistory",
    "customerOrders",
    "confirmedOrders"
];

const SINGLE_ORDER_KEYS = [
    "latestOrder",
    "currentOrder",
    "orderData",
    "confirmedOrder",
    "lastOrder"
];
const TAX_RATE = 0.05;

// The live database is the main source. Browser storage is only a fallback.

function getApiBaseUrl() {
    const apiBaseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");

    if (!apiBaseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return apiBaseUrl;
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

    if (response.status === 204) return null;

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        console.error("The server returned an unreadable response.", error);
    }

    if (response.status === 401 || response.status === 403) {
        endStaffSession();
        throw new Error("Your staff session expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            `Server error ${response.status}`
        );
    }

    return result;
}

function fetchOrdersFromServer() {
    return apiRequest("/orders");
}

function updateOrderStatusOnServer(orderId, newStatus) {
    return apiRequest(
        `/orders/${encodeURIComponent(orderId)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
        }
    );
}

function deleteOrderFromServer(orderId) {
    return apiRequest(
        `/orders/${encodeURIComponent(orderId)}`,
        { method: "DELETE" }
    );
}

const elements = {
    tableBody: document.getElementById("ordersTable"),
    totalOrders: document.getElementById("totalOrders"),
    pendingOrders: document.getElementById("pendingOrders"),
    preparingOrders: document.getElementById("preparingOrders"),
    totalRevenue: document.getElementById("totalRevenue"),
    resultCount: document.getElementById("resultCount"),
    search: document.getElementById("searchOrder"),
    clearSearch: document.getElementById("clearSearch"),
    statusFilter: document.getElementById("statusFilter"),
    sort: document.getElementById("sortOrders"),
    activeFilter: document.getElementById("activeFilter"),
    activeFilterText: document.getElementById("activeFilterText"),
    emptyState: document.getElementById("emptyState"),
    orderModal: document.getElementById("orderModal"),
    deleteModal: document.getElementById("deleteModal"),
    modalStatus: document.getElementById("modalStatus"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),
    refreshButton: document.getElementById("refreshButton")
};

let orders = loadOrders();
let activeOrderId = null;
let pendingDeleteId = null;
let toastTimer = null;

function loadOrders() {
    const storedOrders = [];

    ORDER_LIST_KEYS.forEach((key) => {
        try {
            const stored = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(stored)) {
                storedOrders.push(...stored);
            }
        } catch (error) {
            console.warn(`Could not read ${key} from localStorage.`, error);
        }
    });

    SINGLE_ORDER_KEYS.forEach((key) => {
        try {
            const stored = JSON.parse(localStorage.getItem(key));
            if (stored && typeof stored === "object" && !Array.isArray(stored)) {
                const possibleItems = stored.items || stored.cart || stored.orderItems;
                if (Array.isArray(possibleItems)) storedOrders.push(stored);
            }
        } catch (error) {
            console.warn(`Could not read ${key} from localStorage.`, error);
        }
    });

    if (!storedOrders.length) return [];

    const normalizedOrders = storedOrders.map(normalizeOrder);
    const uniqueOrders = new Map();

    normalizedOrders.forEach((order) => {
        const existing = uniqueOrders.get(order.id);
        const existingDate = existing ? new Date(existing.date).getTime() : 0;
        const incomingDate = new Date(order.date).getTime();

        // A later occurrence of the same order ID normally contains the
        // newest customer, item, total or status information.
        if (!existing || !Number.isFinite(existingDate) || incomingDate >= existingDate) {
            uniqueOrders.set(order.id, order);
        }
    });

    return [...uniqueOrders.values()];
}

async function refreshOrdersFromApi(showMessage = true) {
    try {
        const serverOrders = await fetchOrdersFromServer();
        if (!Array.isArray(serverOrders)) {
            throw new Error("The orders endpoint did not return a list.");
        }
        orders = serverOrders.map(normalizeOrder);
        saveOrders();
        renderOrders();
        if (showMessage) showToast("Orders loaded from the database");
        return true;
    } catch (error) {
        console.warn("Backend unavailable; showing cached orders.", error);
        if (showMessage) showToast("Showing cached orders while the backend is unavailable");
        return false;
    }
}

function normalizeOrder(order, index = 0) {
    const customerObject = order.customerDetails || order.customerInfo || {};
    const rawItems = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.cart)
            ? order.cart
            : Array.isArray(order.orderItems)
                ? order.orderItems
                : [];

    const items = rawItems.map((item) => ({
        name: item.name || item.title || item.itemName || "Menu item",
        quantity: numberValue(item.quantity ?? item.qty ?? item.count ?? 1),
        price: numberValue(item.price ?? item.unitPrice ?? item.rate ?? 0)
    }));

    const date = order.date
        || order.createdAt
        || order.orderDate
        || order.timestamp
        || order.time
        || new Date().toISOString();

    const fallbackId = createStableOrderId(date, order.customer || order.customerName || index);
    const suppliedSubtotal = firstNumber(order.subtotal, order.subTotal);
    const suppliedTax = firstNumber(order.gst, order.tax, order.taxAmount);
    const suppliedTotal = firstNumber(order.total, order.grandTotal, order.totalAmount, order.finalTotal);

    return {
        ...order,
        id: String(order.id || order.orderId || order.orderNumber || order.reference || fallbackId),
        customer: typeof order.customer === "string"
            ? order.customer
            : order.customerName
                || order.name
                || customerObject.name
                || "Guest Customer",
        type: order.type
            || order.orderType
            || order.deliveryType
            || (order.tableNumber ? `Dine-in · Table ${order.tableNumber}` : "Dine-in"),
        date,
        status: normalizeStatus(order.status || order.orderStatus),
        items,
        ...(suppliedSubtotal !== null && { subtotal: suppliedSubtotal }),
        ...(suppliedTax !== null && { tax: suppliedTax }),
        ...(suppliedTotal !== null && { total: suppliedTotal })
    };
}

function numberValue(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function firstNumber(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            return numberValue(value);
        }
    }
    return null;
}

function createStableOrderId(date, customer) {
    const source = `${date}-${customer}`;
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
        hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }

    return `ORD-${String(Math.abs(hash)).padStart(6, "0").slice(-6)}`;
}

function normalizeStatus(status) {
    const validStatuses = ["Pending", "Preparing", "Ready", "Completed"];
    const match = validStatuses.find(
        (item) => item.toLowerCase() === String(status || "").toLowerCase()
    );
    return match || "Pending";
}

function saveOrders() {
    localStorage.setItem("orders", JSON.stringify(orders));
}

function calculateSubtotal(order) {
    const itemTotal = order.items.reduce(
        (sum, item) => sum + numberValue(item.price) * numberValue(item.quantity),
        0
    );

    return numberValue(order.subtotal ?? itemTotal);
}

function calculateTax(order) {
    return numberValue(order.gst ?? order.tax ?? calculateSubtotal(order) * TAX_RATE);
}

function calculateTotal(order) {
    return numberValue(order.total ?? calculateSubtotal(order) + calculateTax(order));
}

function currency(value) {
    return `₹${Number(value).toFixed(2)}`;
}

function escapeHTML(value) {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
}

function formatDate(dateValue, includeYear = false) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        ...(includeYear && { year: "numeric" }),
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function getFilteredOrders() {
    const query = elements.search.value.trim().toLowerCase();
    const selectedStatus = elements.statusFilter.value;
    const sortMode = elements.sort.value;

    const filtered = orders.filter((order) => {
        const searchableText = [
            order.id,
            order.customer,
            order.type,
            ...order.items.map((item) => item.name)
        ].join(" ").toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);
        const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
        if (sortMode === "oldest") return new Date(a.date) - new Date(b.date);
        if (sortMode === "highest") return calculateTotal(b) - calculateTotal(a);
        if (sortMode === "lowest") return calculateTotal(a) - calculateTotal(b);
        return new Date(b.date) - new Date(a.date);
    });
}

function renderOrders() {
    const visibleOrders = getFilteredOrders();
    elements.tableBody.innerHTML = "";

    visibleOrders.forEach((order) => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemNames = order.items.map((item) => item.name).join(", ") || "No items";
        const initial = order.customer.trim().charAt(0).toUpperCase() || "G";
        const row = document.createElement("tr");

        row.innerHTML = `
            <td data-label="Order">
                <span class="order-id">${escapeHTML(order.id)}</span>
                <span class="order-type">${escapeHTML(order.type)}</span>
            </td>
            <td data-label="Customer">
                <div class="customer-cell">
                    <span class="mini-avatar">${escapeHTML(initial)}</span>
                    <span class="customer-name">${escapeHTML(order.customer)}</span>
                </div>
            </td>
            <td data-label="Items">
                <span class="items-preview" title="${escapeHTML(itemNames)}">${escapeHTML(itemNames)}</span>
                <span class="item-count">${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}</span>
            </td>
            <td data-label="Amount" class="amount-cell">${currency(calculateTotal(order))}</td>
            <td data-label="Status">
                <span class="status-badge status-${order.status.toLowerCase()}">${escapeHTML(order.status)}</span>
            </td>
            <td data-label="Placed">
                ${escapeHTML(formatDate(order.date))}
                <span class="placed-date">${escapeHTML(relativeTime(order.date))}</span>
            </td>
            <td data-label="Actions">
                <div class="row-actions">
                    <button class="row-action view" type="button" data-action="view"
                        data-id="${escapeHTML(order.id)}" aria-label="View ${escapeHTML(order.id)}" title="View order">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                    <button class="row-action delete" type="button" data-action="delete"
                        data-id="${escapeHTML(order.id)}" aria-label="Delete ${escapeHTML(order.id)}" title="Delete order">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        elements.tableBody.appendChild(row);
    });

    elements.emptyState.hidden = visibleOrders.length !== 0;
    elements.tableBody.closest("table").hidden = visibleOrders.length === 0;
    elements.resultCount.textContent = `${visibleOrders.length} ${visibleOrders.length === 1 ? "order" : "orders"}`;

    updateStats();
    updateFilterMessage();
}

function relativeTime(dateValue) {
    const minutes = Math.round((Date.now() - new Date(dateValue).getTime()) / 60000);
    if (!Number.isFinite(minutes)) return "";
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
}

function updateStats() {
    const completedRevenue = orders
        .filter((order) => order.status === "Completed")
        .reduce((sum, order) => sum + calculateTotal(order), 0);

    elements.totalOrders.textContent = orders.length;
    elements.pendingOrders.textContent = orders.filter((order) => order.status === "Pending").length;
    elements.preparingOrders.textContent = orders.filter((order) => order.status === "Preparing").length;
    elements.totalRevenue.textContent = currency(completedRevenue);
}

function updateFilterMessage() {
    const query = elements.search.value.trim();
    const status = elements.statusFilter.value;
    const filterParts = [];

    if (query) filterParts.push(`Search: “${query}”`);
    if (status !== "All") filterParts.push(`Status: ${status}`);

    elements.search.closest(".search-box").classList.toggle("has-value", Boolean(query));
    elements.activeFilter.hidden = filterParts.length === 0;
    elements.activeFilterText.textContent = filterParts.join(" · ");
}

function openOrderModal(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    activeOrderId = order.id;
    const itemQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("modalOrderId").textContent = order.id;
    document.getElementById("modalCustomer").textContent = order.customer;
    document.getElementById("modalAvatar").textContent = order.customer.charAt(0).toUpperCase();
    document.getElementById("modalDate").textContent = formatDate(order.date, true);
    document.getElementById("modalItemCount").textContent =
        `${itemQuantity} ${itemQuantity === 1 ? "item" : "items"}`;
    document.getElementById("modalSubtotal").textContent = calculateSubtotal(order).toFixed(2);
    document.getElementById("modalGST").textContent = calculateTax(order).toFixed(2);
    document.getElementById("modalTotal").textContent = calculateTotal(order).toFixed(2);
    elements.modalStatus.value = order.status;

    const itemsContainer = document.getElementById("orderItems");
    itemsContainer.innerHTML = order.items.length
        ? order.items.map((item) => `
            <div class="modal-item">
                <span class="modal-item-name">${escapeHTML(item.name)}</span>
                <span class="modal-item-qty">× ${item.quantity}</span>
                <span class="modal-item-price">${currency(item.price * item.quantity)}</span>
            </div>
        `).join("")
        : `<div class="modal-item"><span class="modal-item-name">No items recorded</span></div>`;

    showModal(elements.orderModal);
}

function openDeleteModal(orderId) {
    pendingDeleteId = orderId;
    document.getElementById("deleteOrderId").textContent = orderId;
    showModal(elements.deleteModal);
}

function showModal(modal) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => modal.querySelector("button")?.focus(), 50);
}

function closeModal(modal) {
    modal.hidden = true;
    if (elements.orderModal.hidden && elements.deleteModal.hidden) {
        document.body.classList.remove("modal-open");
    }
}

function resetFilters() {
    elements.search.value = "";
    elements.statusFilter.value = "All";
    elements.sort.value = "newest";
    renderOrders();
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (button.dataset.action === "view") openOrderModal(button.dataset.id);
    if (button.dataset.action === "delete") openDeleteModal(button.dataset.id);
});

elements.search.addEventListener("input", renderOrders);
elements.statusFilter.addEventListener("change", renderOrders);
elements.sort.addEventListener("change", renderOrders);

elements.clearSearch.addEventListener("click", () => {
    elements.search.value = "";
    elements.search.focus();
    renderOrders();
});

document.getElementById("resetFilters").addEventListener("click", resetFilters);
document.getElementById("emptyResetButton").addEventListener("click", resetFilters);

document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "../html/admin-dashboard.html";
});

document.getElementById("closeOrderModal").addEventListener("click", () => {
    closeModal(elements.orderModal);
});

document.querySelectorAll("[data-close-modal]").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
        closeModal(backdrop.dataset.closeModal === "order" ? elements.orderModal : elements.deleteModal);
    });
});

document.getElementById("cancelDelete").addEventListener("click", () => {
    pendingDeleteId = null;
    closeModal(elements.deleteModal);
});

document.getElementById("confirmDelete").addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const orderId = pendingDeleteId;

    try {
        await deleteOrderFromServer(orderId);
    } catch (error) {
        console.error("The order could not be deleted from the database.", error);
        closeModal(elements.deleteModal);
        showToast(error.message || `${orderId} could not be deleted`);
        pendingDeleteId = null;
        return;
    }

    orders = orders.filter((order) => order.id !== orderId);
    saveOrders();
    renderOrders();
    closeModal(elements.deleteModal);
    showToast(`${orderId} was deleted`);
    pendingDeleteId = null;
});

document.getElementById("saveStatus").addEventListener("click", async () => {
    const order = orders.find((item) => item.id === activeOrderId);
    if (!order) return;

    const selectedStatus = elements.modalStatus.value;

    try {
        const updatedOrder = await updateOrderStatusOnServer(order.id, selectedStatus);
        Object.assign(order, normalizeOrder(updatedOrder));
    } catch (error) {
        console.error("The status could not be updated in the database.", error);
        showToast(error.message || `${order.id} could not be updated`);
        return;
    }

    saveOrders();
    renderOrders();
    closeModal(elements.orderModal);
    showToast(`${order.id} updated to ${order.status}`);
});

document.getElementById("printOrder").addEventListener("click", () => window.print());

elements.refreshButton.addEventListener("click", async () => {
    elements.refreshButton.classList.add("loading");
    const loaded = await refreshOrdersFromApi(false);
    if (!loaded) {
        orders = loadOrders();
        renderOrders();
    }
    elements.refreshButton.classList.remove("loading");
    showToast(loaded ? "Orders refreshed from the database" : "Cached orders refreshed");
});

// Update the table when checkout/order-confirmation saves an order in
// another browser tab or when the admin returns to this page.
window.addEventListener("storage", (event) => {
    if (![...ORDER_LIST_KEYS, ...SINGLE_ORDER_KEYS].includes(event.key)) return;
    orders = loadOrders();
    renderOrders();
    showToast("A new order was received");
});

window.addEventListener("focus", async () => {
    const loaded = await refreshOrdersFromApi(false);
    if (loaded) return;
    const cachedOrders = loadOrders();
    if (JSON.stringify(cachedOrders) !== JSON.stringify(orders)) {
        orders = cachedOrders;
        renderOrders();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.deleteModal.hidden) closeModal(elements.deleteModal);
    else if (!elements.orderModal.hidden) closeModal(elements.orderModal);
});

document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
}).format(new Date());

renderOrders();
refreshOrdersFromApi(false);
