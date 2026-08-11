"use strict";

/* =========================================
   ALLEPPEY PUB ERP - ORDER TRACKING
========================================= */

const LAST_ORDER_KEY = "latestOrder";
const ORDER_STORAGE_KEY = "pubOrders";
const CART_STORAGE_KEY = "cart";
const STATUS_REFRESH_INTERVAL = 15000;

const STATUS_STEPS = [
    "Pending",
    "Preparing",
    "Ready",
    "Completed"
];

let currentOrder = null;
let statusTimer = null;
let toastTimer = null;


/* =========================================
   HTML ELEMENTS
========================================= */

const orderIdElement = document.getElementById("orderId");
const orderDateElement = document.getElementById("orderDate");
const orderTimeElement = document.getElementById("orderTime");
const customerNameElement = document.getElementById("customerName");
const tableNumberElement = document.getElementById("tableNumber");
const orderTypeElement = document.getElementById("orderType");
const paymentMethodElement = document.getElementById("paymentMethod");
const orderStatusElement = document.getElementById("orderStatus");
const headerStatusElement = document.getElementById("headerStatus");

const prepTimeElement = document.getElementById("prepTime");
const statusDescriptionElement = document.getElementById("statusDescription");
const preparationProgress = document.getElementById("preparationProgress");
const progressSteps = document.querySelectorAll("[data-status-step]");
const lastStatusUpdate = document.getElementById("lastStatusUpdate");
const refreshStatusBtn = document.getElementById("refreshStatus");

const orderItemsBody = document.getElementById("orderItems");
const orderItemCount = document.getElementById("orderItemCount");
const emptyItems = document.getElementById("emptyItems");

const subtotalElement = document.getElementById("subtotal");
const discountElement = document.getElementById("discount");
const gstAmountElement = document.getElementById("gstAmount");
const serviceChargeElement = document.getElementById("serviceCharge");
const grandTotalElement = document.getElementById("grandTotal");

const printReceiptBtn = document.getElementById("printReceipt");
const newOrderBtn = document.getElementById("newOrder");
const goHomeBtn = document.getElementById("goHome");
const toast = document.getElementById("toast");


/* =========================================
   API HELPERS
========================================= */

function getApiBaseUrl() {
    const apiBaseUrl = String(
        window.PUB_API_BASE_URL || ""
    ).replace(/\/+$/, "");

    if (!apiBaseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return apiBaseUrl;
}


async function fetchOrderFromServer(orderId) {
    const response = await fetch(
        `${getApiBaseUrl()}/orders/${encodeURIComponent(orderId)}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

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

    return result;
}


/* =========================================
   LOAD CACHED ORDER
========================================= */

function readJSON(storageKey) {
    try {
        return JSON.parse(localStorage.getItem(storageKey));
    } catch (error) {
        console.warn(`Could not read ${storageKey}.`, error);
        return null;
    }
}


function getRequestedOrderId() {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("order")?.trim() || "";
}


function loadCachedOrder() {
    const requestedOrderId = getRequestedOrderId();
    const latestOrder = readJSON(LAST_ORDER_KEY);

    if (
        latestOrder &&
        typeof latestOrder === "object" &&
        (!requestedOrderId || String(latestOrder.id) === requestedOrderId)
    ) {
        return normalizeOrder(latestOrder);
    }

    const savedOrders = readJSON(ORDER_STORAGE_KEY);

    if (!Array.isArray(savedOrders) || savedOrders.length === 0) {
        return null;
    }

    const matchingOrder = requestedOrderId
        ? savedOrders.find((order) => String(order.id) === requestedOrderId)
        : savedOrders[savedOrders.length - 1];

    return matchingOrder
        ? normalizeOrder(matchingOrder)
        : null;
}


function saveOrderToCache(order) {
    localStorage.setItem(
        LAST_ORDER_KEY,
        JSON.stringify(order)
    );

    const savedOrders = readJSON(ORDER_STORAGE_KEY);
    const orderList = Array.isArray(savedOrders)
        ? savedOrders
        : [];

    const existingIndex = orderList.findIndex(
        (item) => String(item.id) === String(order.id)
    );

    if (existingIndex >= 0) {
        orderList[existingIndex] = order;
    } else {
        orderList.push(order);
    }

    localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(orderList)
    );
}


/* =========================================
   NORMALIZE ORDER
========================================= */

function normalizeOrder(order) {
    const items = Array.isArray(order.items)
        ? order.items.map(normalizeItem)
        : [];

    const calculatedSubtotal = calculateItemsTotal(items);
    const subtotal = firstNumber(order.subtotal, calculatedSubtotal);
    const discount = firstNumber(order.discount, order.discountAmount, 0);
    const gst = firstNumber(order.gst, order.gstAmount, 0);
    const serviceCharge = firstNumber(
        order.serviceCharge,
        order.serviceChargeAmount,
        0
    );
    const calculatedTotal = Math.max(
        0,
        subtotal - discount + gst + serviceCharge
    );
    const total = firstNumber(order.total, order.grandTotal, calculatedTotal);

    return {
        ...order,
        id: String(order.id || order.orderId || ""),
        customer: String(
            order.customer ||
            order.customerName ||
            "Walk-in Customer"
        ),
        table: String(
            order.table ||
            order.tableNumber ||
            "N/A"
        ),
        orderType: String(
            order.orderType ||
            order.type ||
            "Dine In"
        ),
        paymentMethod: String(
            order.paymentMethod ||
            order.payment ||
            "Cash"
        ),
        status: normalizeStatus(order.status),
        createdAt:
            order.createdAt ||
            order.date ||
            new Date().toISOString(),
        preparationTime: numberValue(
            order.preparationTime ||
            order.prepTime ||
            calculatePreparationTime(items)
        ),
        items,
        subtotal,
        discount,
        gst,
        serviceCharge,
        total
    };
}


function normalizeItem(item) {
    return {
        id: item.id || "",
        name: String(
            item.name ||
            item.itemName ||
            "Menu Item"
        ),
        price: numberValue(item.price),
        quantity: Math.max(
            1,
            numberValue(item.quantity ?? item.qty ?? 1)
        ),
        notes: String(item.notes || "")
    };
}


function normalizeStatus(status) {
    const value = String(status || "Pending").trim().toLowerCase();

    if (value === "confirmed" || value === "received") return "Pending";
    if (value === "in preparation") return "Preparing";

    const match = STATUS_STEPS.find(
        (step) => step.toLowerCase() === value
    );

    return match || "Pending";
}


/* =========================================
   REFRESH ORDER FROM DATABASE
========================================= */

async function refreshOrderStatus(showMessage = true) {
    const orderId =
        currentOrder?.id ||
        getRequestedOrderId();

    if (!orderId) {
        showToast("No recent order was found.", "error");
        return false;
    }

    refreshStatusBtn.disabled = true;
    refreshStatusBtn.classList.add("loading");

    try {
        const oldStatus = currentOrder?.status;
        const serverOrder = await fetchOrderFromServer(orderId);

        currentOrder = normalizeOrder(serverOrder);
        saveOrderToCache(currentOrder);
        renderConfirmedOrder();

        if (showMessage) {
            showToast("Order status refreshed.", "success");
        } else if (oldStatus && oldStatus !== currentOrder.status) {
            showToast(
                `Your order is now ${currentOrder.status}.`,
                "success"
            );
        }

        if (currentOrder.status === "Completed") {
            stopStatusPolling();
        }

        return true;

    } catch (error) {
        console.error("Could not refresh the order status.", error);

        lastStatusUpdate.textContent =
            "Unable to contact the server Â· showing saved details";

        if (showMessage) {
            showToast(
                error.message || "Could not refresh the order status.",
                "error"
            );
        }

        return false;

    } finally {
        refreshStatusBtn.disabled = false;
        refreshStatusBtn.classList.remove("loading");
    }
}


/* =========================================
   RENDER ORDER
========================================= */

function renderConfirmedOrder() {
    if (!currentOrder) return;

    const orderDate = new Date(currentOrder.createdAt);

    orderIdElement.textContent = currentOrder.id;
    orderDateElement.textContent = formatDate(orderDate);
    orderTimeElement.textContent = formatTime(orderDate);
    customerNameElement.textContent = currentOrder.customer;
    tableNumberElement.textContent = currentOrder.table;
    orderTypeElement.textContent = currentOrder.orderType;
    paymentMethodElement.textContent = currentOrder.paymentMethod;
    orderStatusElement.textContent = currentOrder.status;

    orderStatusElement.classList.remove(
        "status-pending",
        "status-preparing",
        "status-ready",
        "status-completed"
    );
    orderStatusElement.classList.add(
        `status-${currentOrder.status.toLowerCase()}`
    );

    subtotalElement.textContent = formatCurrency(currentOrder.subtotal);
    discountElement.textContent = `- ${formatCurrency(currentOrder.discount)}`;
    gstAmountElement.textContent = formatCurrency(currentOrder.gst);
    serviceChargeElement.textContent = formatCurrency(currentOrder.serviceCharge);
    grandTotalElement.textContent = formatCurrency(currentOrder.total);

    renderOrderItems();
    updateStatusTracker();
}


function renderOrderItems() {
    orderItemsBody.innerHTML = "";

    if (!currentOrder.items.length) {
        emptyItems.classList.add("show");
        orderItemCount.textContent = "0 Items";
        return;
    }

    emptyItems.classList.remove("show");

    currentOrder.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="item-name-cell">
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>${escapeHTML(item.notes || "No special instructions")}</small>
                </div>
            </td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>
                <span class="item-total">
                    ${formatCurrency(itemTotal)}
                </span>
            </td>
        `;

        orderItemsBody.appendChild(row);
    });

    const totalQuantity = currentOrder.items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    orderItemCount.textContent =
        `${totalQuantity} ${totalQuantity === 1 ? "Item" : "Items"}`;
}


/* =========================================
   STATUS TRACKER
========================================= */

function updateStatusTracker() {
    const statusIndex = Math.max(
        0,
        STATUS_STEPS.indexOf(currentOrder.status)
    );

    const progressValues = [15, 45, 75, 100];
    preparationProgress.style.width = `${progressValues[statusIndex]}%`;

    progressSteps.forEach((step, index) => {
        step.classList.toggle("active", index <= statusIndex);
        step.classList.toggle("current", index === statusIndex);
    });

    const statusMessages = {
        Pending: {
            title: "Order Received",
            description: "Your order has been received and is waiting for the kitchen."
        },
        Preparing: {
            title: "Being Prepared",
            description: "The kitchen is currently preparing your food and drinks."
        },
        Ready: {
            title: "Ready Now",
            description: "Your order is ready for service or collection."
        },
        Completed: {
            title: "Order Completed",
            description: "Your order has been completed. Thank you for visiting us."
        }
    };

    const message = statusMessages[currentOrder.status];
    prepTimeElement.textContent = message.title;
    statusDescriptionElement.textContent = message.description;
    headerStatusElement.lastChild.textContent = ` ${currentOrder.status}`;

    lastStatusUpdate.textContent =
        `Last checked ${new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })}`;
}


/* =========================================
   AUTOMATIC STATUS CHECKING
========================================= */

function startStatusPolling() {
    stopStatusPolling();

    if (!currentOrder || currentOrder.status === "Completed") return;

    statusTimer = window.setInterval(() => {
        if (!document.hidden) {
            refreshOrderStatus(false);
        }
    }, STATUS_REFRESH_INTERVAL);
}


function stopStatusPolling() {
    if (statusTimer) {
        window.clearInterval(statusTimer);
        statusTimer = null;
    }
}


/* =========================================
   BUTTON EVENTS
========================================= */

refreshStatusBtn.addEventListener("click", async () => {
    const refreshed = await refreshOrderStatus(true);
    if (refreshed) startStatusPolling();
});


printReceiptBtn.addEventListener("click", () => {
    window.print();
});


newOrderBtn.addEventListener("click", () => {
    stopStatusPolling();
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(LAST_ORDER_KEY);
    window.location.href = "../html/menu.html";
});


goHomeBtn.addEventListener("click", () => {
    window.location.href = "../html/customer-home.html";
});


window.addEventListener("focus", () => {
    if (currentOrder && currentOrder.status !== "Completed") {
        refreshOrderStatus(false);
    }
});


window.addEventListener("beforeunload", stopStatusPolling);


/* =========================================
   HELPERS
========================================= */

function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function firstNumber(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            return numberValue(value);
        }
    }
    return 0;
}


function calculateItemsTotal(items) {
    return items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}


function calculatePreparationTime(items) {
    const totalQuantity = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return Math.min(
        35,
        Math.max(12, 10 + totalQuantity * 2)
    );
}


function formatCurrency(value) {
    return numberValue(value).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );
}


function formatDate(date) {
    if (Number.isNaN(date.getTime())) return "â€”";

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(date) {
    if (Number.isNaN(date.getTime())) return "â€”";

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showToast(message, type = "") {
    toast.textContent = message;
    toast.classList.remove("show", "success", "error");

    if (type) toast.classList.add(type);

    toast.classList.add("show");
    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializeConfirmationPage() {
    currentOrder = loadCachedOrder();

    if (currentOrder) {
        renderConfirmedOrder();
    }

    const orderId = currentOrder?.id || getRequestedOrderId();

    if (!orderId) {
        orderIdElement.textContent = "Not available";
        refreshStatusBtn.disabled = true;
        lastStatusUpdate.textContent = "No recent order was found";
        showToast("No recent order was found.", "error");
        return;
    }

    await refreshOrderStatus(false);
    startStatusPolling();
}


initializeConfirmationPage();