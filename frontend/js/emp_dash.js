"use strict";

/* Alleppey Pub ERP - live employee dashboard */

const ORDER_CACHE_KEY = "pubOrders";
const REFRESH_INTERVAL = 20000;

const STATUS_OPTIONS = [
    "Pending",
    "Preparing",
    "Ready",
    "Completed"
];

let orders = [];
let toastTimer = null;


/* ==========================================
   PAGE ELEMENTS
========================================== */

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


/* ==========================================
   EMPLOYEE ACCESS
========================================== */

function checkEmployeeAccess() {
    const role =
        localStorage.getItem("userRole");

    const employeeLoggedIn =
        localStorage.getItem("employeeLoggedIn") === "true" ||
        sessionStorage.getItem("employeeLoggedIn") === "true";

    if (role !== "employee" || !employeeLoggedIn) {
        window.location.replace("role-selection.html");
        return false;
    }

    return true;
}


/* ==========================================
   API
========================================== */

function getApiBaseUrl() {
    const baseUrl =
        String(window.PUB_API_BASE_URL || "")
            .replace(/\/+$/, "");

    if (!baseUrl) {
        throw new Error(
            "The backend URL is missing from config.js."
        );
    }

    return baseUrl;
}


async function apiRequest(path, options = {}) {
    const response = await fetch(
        `${getApiBaseUrl()}${path}`,
        {
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        }
    );

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        if (response.status !== 204) {
            console.error(
                "The server response could not be read.",
                error
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            `Server error ${response.status}`
        );
    }

    return result;
}


/* ==========================================
   REFRESH LIVE ORDERS
========================================== */

async function refreshOrders(showMessage = true) {
    setRefreshLoading(true);

    try {
        const result =
            await apiRequest("/orders");

        orders =
            Array.isArray(result)
                ? result.map(normalizeOrder)
                : [];

        localStorage.setItem(
            ORDER_CACHE_KEY,
            JSON.stringify(orders)
        );

        renderDashboard();
        showDataStatus(false);

        if (showMessage) {
            showToast(
                "Orders refreshed from the database.",
                "success"
            );
        }
    } catch (error) {
        console.error(
            "Could not load live orders.",
            error
        );

        orders = loadCachedOrders();

        renderDashboard();
        showDataStatus(true);

        if (showMessage) {
            showToast(
                "Server unavailable. Showing saved orders.",
                "error"
            );
        }
    } finally {
        setRefreshLoading(false);
    }
}


/* ==========================================
   UPDATE ORDER STATUS
========================================== */

async function updateOrderStatus(
    orderId,
    status,
    selectElement
) {
    selectElement.disabled = true;

    try {
        const updatedOrder =
            await apiRequest(
                `/orders/${encodeURIComponent(orderId)}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: status
                    })
                }
            );

        orders = orders.map(order => {
            if (order.id === orderId) {
                return normalizeOrder(updatedOrder);
            }

            return order;
        });

        localStorage.setItem(
            ORDER_CACHE_KEY,
            JSON.stringify(orders)
        );

        renderDashboard();

        showToast(
            `${orderId} changed to ${status}.`,
            "success"
        );
    } catch (error) {
        console.error(
            "Could not update order status.",
            error
        );

        renderOrders();

        showToast(
            error.message ||
            "Could not update the order.",
            "error"
        );
    }
}


/* ==========================================
   CACHED ORDERS
========================================== */

function loadCachedOrders() {
    try {
        const savedOrders =
            JSON.parse(
                localStorage.getItem(
                    ORDER_CACHE_KEY
                )
            );

        return Array.isArray(savedOrders)
            ? savedOrders.map(normalizeOrder)
            : [];
    } catch (error) {
        console.warn(
            "Saved orders could not be read.",
            error
        );

        return [];
    }
}


/* ==========================================
   NORMALIZE ORDER
========================================== */

function normalizeOrder(order, index = 0) {
    const total =
        Number(
            order?.total ??
            order?.grandTotal ??
            0
        );

    const items =
        Array.isArray(order?.items)
            ? order.items
            : [];

    const itemCount =
        Number(order?.itemCount) ||
        items.reduce(
            (sum, item) => {
                return sum +
                    (
                        Number(
                            item.qty ??
                            item.quantity
                        ) || 0
                    );
            },
            0
        );

    return {
        ...order,

        id: String(
            order?.id ||
            order?.orderId ||
            `ORDER-${index + 1}`
        ),

        table: String(
            order?.table ||
            order?.tableNumber ||
            "Takeaway"
        ),

        customer: String(
            order?.customer ||
            order?.customerName ||
            "Walk-in Customer"
        ),

        status: String(
            order?.status ||
            "Pending"
        ),

        total:
            Number.isFinite(total)
                ? total
                : 0,

        items: items,

        itemCount: itemCount,

        createdAt:
            order?.createdAt ||
            order?.date ||
            ""
    };
}


/* ==========================================
   ORDER HELPERS
========================================== */

function normalizeStatus(status) {
    return String(status || "")
        .trim()
        .toLowerCase();
}


function isActiveOrder(order) {
    const status =
        normalizeStatus(order.status);

    return ![
        "completed",
        "cancelled"
    ].includes(status);
}


/* ==========================================
   RENDER DASHBOARD
========================================== */

function renderDashboard() {
    renderOrders();
    renderStatistics();
    renderActivity();
}


/* ==========================================
   RENDER ORDERS
========================================== */

function renderOrders() {
    const activeOrders =
        orders.filter(isActiveOrder);

    if (!activeOrders.length) {
        elements.ordersTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-orders"
                >
                    No active orders are waiting right now.
                </td>
            </tr>
        `;

        return;
    }

    elements.ordersTable.innerHTML =
        activeOrders
            .slice(0, 10)
            .map(order => {
                const currentStatus =
                    normalizeStatus(order.status);

                const statusOptions =
                    STATUS_OPTIONS
                        .map(option => {
                            const selected =
                                normalizeStatus(option) === currentStatus
                                    ? "selected"
                                    : "";

                            return `
                                <option
                                    value="${option}"
                                    ${selected}
                                >
                                    ${option}
                                </option>
                            `;
                        })
                        .join("");

                return `
                    <tr>
                        <td>
                            <strong>
                                ${escapeHTML(order.id)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                formatTable(order.table)
                            )}
                        </td>

                        <td>
                            ${escapeHTML(order.customer)}
                        </td>

                        <td>
                            ${escapeHTML(
                                formatItemCount(
                                    order.itemCount
                                )
                            )}
                        </td>

                        <td>
                            <select
                                class="
                                    status-select
                                    ${getStatusClass(order.status)}
                                "
                                data-order-id="
                                    ${escapeAttribute(order.id)}
                                "
                                aria-label="
                                    Change status for
                                    ${escapeAttribute(order.id)}
                                "
                            >
                                ${statusOptions}
                            </select>
                        </td>

                        <td>
                            ${formatMoney(order.total)}
                        </td>
                    </tr>
                `;
            })
            .join("");
}


/* ==========================================
   DASHBOARD STATISTICS
========================================== */

function renderStatistics() {
    function countStatus(status) {
        return orders.filter(order => {
            return normalizeStatus(order.status) === status;
        }).length;
    }

    const occupiedTables =
        new Set(
            orders
                .filter(isActiveOrder)
                .map(order => {
                    return String(order.table).trim();
                })
                .filter(table => {
                    return (
                        table &&
                        !/takeaway/i.test(table)
                    );
                })
        ).size;

    elements.pendingCount.textContent =
        countStatus("pending");

    elements.preparingCount.textContent =
        countStatus("preparing");

    elements.readyCount.textContent =
        countStatus("ready");

    elements.occupiedCount.textContent =
        occupiedTables;
}


/* ==========================================
   RECENT ACTIVITY
========================================== */

function renderActivity() {
    const recentOrders =
        [...orders]
            .sort((firstOrder, secondOrder) => {
                return (
                    getOrderTime(secondOrder) -
                    getOrderTime(firstOrder)
                );
            })
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

    elements.activityList.innerHTML =
        recentOrders
            .map(order => {
                return `
                    <li>
                        <i
                            class="
                                fa-solid
                                ${getActivityIcon(order.status)}
                            "
                        ></i>

                        <span>
                            <strong>
                                ${escapeHTML(order.id)}
                            </strong>

                            is ${escapeHTML(order.status)}

                            <small>
                                ${escapeHTML(
                                    formatOrderTime(
                                        order.createdAt
                                    )
                                )}
                            </small>
                        </span>
                    </li>
                `;
            })
            .join("");
}


/* ==========================================
   DATA STATUS
========================================== */

function showDataStatus(usingCache) {
    if (usingCache) {
        elements.dataStatus.textContent =
            "Saved data - backend currently unavailable";

        elements.dataStatus.classList.add(
            "offline"
        );

        return;
    }

    const time =
        new Date().toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    elements.dataStatus.textContent =
        `Live database - updated ${time}`;

    elements.dataStatus.classList.remove(
        "offline"
    );
}


/* ==========================================
   EMPLOYEE PROFILE
========================================== */

function loadEmployeeProfile() {
    const username =
        localStorage.getItem("loggedInUser") ||
        sessionStorage.getItem("loggedInUser") ||
        "Employee";

    const employeeName =
        formatEmployeeName(username);

    elements.employeeName.textContent =
        employeeName;

    elements.welcomeMessage.textContent =
        `Welcome back, ${employeeName}! Have a productive shift.`;
}


function formatEmployeeName(username) {
    return String(username)
        .replace(/[-_]/g, " ")
        .replace(
            /\b\w/g,
            letter => letter.toUpperCase()
        );
}


/* ==========================================
   LIVE CLOCK
========================================== */

function updateClock() {
    const currentDate = new Date();

    const time =
        currentDate.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata"
            }
        );

    const date =
        currentDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata"
            }
        );

    elements.liveClock.innerHTML = `
        <div>${time}</div>
        <small>${date}</small>
    `;
}


/* ==========================================
   FORMATTING
========================================== */

function formatTable(table) {
    const value =
        String(table || "");

    return /^\d+$/.test(value)
        ? `Table ${value}`
        : value;
}


function formatItemCount(count) {
    const number =
        Number(count) || 0;

    return `${number} item${
        number === 1 ? "" : "s"
    }`;
}


function formatMoney(amount) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(
        Number(amount) || 0
    );
}


function formatOrderTime(value) {
    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently added";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function getOrderTime(order) {
    const time =
        new Date(order.createdAt)
            .getTime();

    return Number.isFinite(time)
        ? time
        : 0;
}


/* ==========================================
   STATUS STYLING
========================================== */

function getStatusClass(status) {
    const normalized =
        normalizeStatus(status);

    const allowedStatuses = [
        "pending",
        "preparing",
        "ready",
        "completed"
    ];

    return allowedStatuses.includes(normalized)
        ? normalized
        : "pending";
}


function getActivityIcon(status) {
    const normalized =
        normalizeStatus(status);

    if (normalized === "completed") {
        return "fa-circle-check";
    }

    if (normalized === "ready") {
        return "fa-bell-concierge";
    }

    if (normalized === "preparing") {
        return "fa-fire-burner";
    }

    return "fa-clock";
}


/* ==========================================
   SECURITY HELPERS
========================================== */

function escapeHTML(value) {
    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

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


/* ==========================================
   REFRESH BUTTON
========================================== */

function setRefreshLoading(isLoading) {
    elements.refreshButton.disabled =
        isLoading;

    const icon =
        elements.refreshButton
            .querySelector("i");

    if (icon) {
        icon.classList.toggle(
            "fa-spin",
            isLoading
        );
    }
}


/* ==========================================
   TOAST MESSAGE
========================================== */

function showToast(
    message,
    type = "success"
) {
    clearTimeout(toastTimer);

    elements.toast.textContent =
        message;

    elements.toast.className =
        `toast ${type} show`;

    toastTimer =
        setTimeout(() => {
            elements.toast.classList.remove(
                "show"
            );
        }, 2600);
}


/* ==========================================
   LOGOUT
========================================== */

function logout() {
    const loginKeys = [
        "loggedInUser",
        "userRole",
        "isLoggedIn",
        "employeeLoggedIn"
    ];

    loginKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    window.location.href =
        "role-selection.html";
}


/* ==========================================
   PAGE EVENTS
========================================== */

function initializeEvents() {
    elements.refreshButton.addEventListener(
        "click",
        function () {
            refreshOrders(true);
        }
    );

    elements.logoutButton.addEventListener(
        "click",
        logout
    );

    elements.sidebarLogoutButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            logout();
        }
    );

    elements.newOrderButton.addEventListener(
        "click",
        function () {
            window.location.href =
                "menu.html";
        }
    );

    elements.printButton.addEventListener(
        "click",
        function () {
            window.location.href =
                "billing-pos.html";
        }
    );

    elements.viewOrdersButton.addEventListener(
        "click",
        function () {
            document
                .getElementById("liveOrders")
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    );

    elements.ordersTable.addEventListener(
        "change",
        function (event) {
            const select =
                event.target.closest(
                    ".status-select"
                );

            if (select) {
                updateOrderStatus(
                    select.dataset.orderId,
                    select.value,
                    select
                );
            }
        }
    );

    window.addEventListener(
        "storage",
        function (event) {
            if (
                event.key ===
                ORDER_CACHE_KEY
            ) {
                orders =
                    loadCachedOrders();

                renderDashboard();
            }
        }
    );
}


/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

async function initializeDashboard() {
    if (!checkEmployeeAccess()) {
        return;
    }

    orders = loadCachedOrders();

    loadEmployeeProfile();
    updateClock();
    renderDashboard();
    initializeEvents();

    window.setInterval(
        updateClock,
        1000
    );

    await refreshOrders(false);

    window.setInterval(
        function () {
            if (!document.hidden) {
                refreshOrders(false);
            }
        },
        REFRESH_INTERVAL
    );
}


document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);