/* ==========================================
   ALLEPPEY PUB ERP
   EMPLOYEE DASHBOARD
========================================== */

const ORDER_STORAGE_KEY = "pubOrders";

const liveClock =
    document.getElementById("liveClock");

const ordersTable =
    document.getElementById("ordersTable");

const refreshButton =
    document.querySelector(".refresh-btn");

const logoutButton =
    document.getElementById("logoutBtn");

const toast =
    document.getElementById("toast");

const statisticNumbers =
    document.querySelectorAll(".cards .card h2");

const actionButtons =
    document.querySelectorAll(".action-grid button");


/* ==========================================
   DEMONSTRATION ORDERS
========================================== */

const demonstrationOrders = [
    {
        id: "#1025",
        table: "5",
        customer: "John",
        status: "Preparing",
        total: 1250
    },
    {
        id: "#1026",
        table: "2",
        customer: "Rahul",
        status: "Pending",
        total: 860
    },
    {
        id: "#1027",
        table: "8",
        customer: "Anu",
        status: "Ready",
        total: 740
    },
    {
        id: "#1028",
        table: "11",
        customer: "Alex",
        status: "Completed",
        total: 1420
    }
];


/* ==========================================
   LIVE CLOCK
========================================== */

function updateClock() {

    const currentDate = new Date();

    const time = currentDate.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        }
    );

    const date = currentDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata"
        }
    );

    liveClock.innerHTML = `
        <div>${time}</div>

        <small style="
            display:block;
            margin-top:4px;
            color:#aaa;
            font-size:12px;
            font-weight:400;
        ">
            ${date}
        </small>
    `;
}

updateClock();

setInterval(updateClock, 1000);


/* ==========================================
   LOAD ORDERS
========================================== */

function loadOrders() {

    try {

        const savedOrders =
            JSON.parse(
                localStorage.getItem(
                    ORDER_STORAGE_KEY
                )
            );

        if (
            Array.isArray(savedOrders) &&
            savedOrders.length > 0
        ) {
            return savedOrders.map(
                normalizeOrder
            );
        }

    } catch (error) {

        console.error(
            "Unable to load orders:",
            error
        );

    }

    return demonstrationOrders.map(
        normalizeOrder
    );
}


/* ==========================================
   NORMALIZE ORDER
========================================== */

function normalizeOrder(order, index) {

    const total =
        Number(
            order.total ??
            order.grandTotal ??
            order.finalTotal ??
            0
        );

    return {
        id:
            order.id ||
            order.orderId ||
            `#${1025 + index}`,

        table:
            order.table ||
            order.tableNumber ||
            "-",

        customer:
            order.customer ||
            order.customerName ||
            "Walk-in Customer",

        status:
            order.status ||
            "Pending",

        total:
            Number.isFinite(total)
                ? total
                : 0
    };
}


/* ==========================================
   RENDER ORDERS
========================================== */

function renderOrders() {

    const orders = loadOrders();

    if (!ordersTable) {
        return;
    }

    if (orders.length === 0) {

        ordersTable.innerHTML = `
            <tr>
                <td colspan="5"
                    class="empty-orders">

                    No live orders available.

                </td>
            </tr>
        `;

        updateStatistics([]);

        return;
    }

    ordersTable.innerHTML = orders
        .slice()
        .reverse()
        .slice(0, 8)
        .map((order) => {

            const statusClass =
                getStatusClass(
                    order.status
                );

            return `
                <tr>

                    <td>
                        ${escapeHTML(order.id)}
                    </td>

                    <td>
                        ${escapeHTML(order.table)}
                    </td>

                    <td>
                        ${escapeHTML(order.customer)}
                    </td>

                    <td>

                        <span class="status ${statusClass}">

                            ${escapeHTML(order.status)}

                        </span>

                    </td>

                    <td>
                        ${formatMoney(order.total)}
                    </td>

                </tr>
            `;

        })
        .join("");

    updateStatistics(orders);
}


/* ==========================================
   UPDATE STATISTICS
========================================== */

function updateStatistics(orders) {

    const pendingOrders =
        orders.filter((order) =>
            normalizeStatus(order.status) ===
            "pending"
        ).length;

    const preparingOrders =
        orders.filter((order) =>
            normalizeStatus(order.status) ===
            "preparing"
        ).length;

    const readyOrders =
        orders.filter((order) =>
            normalizeStatus(order.status) ===
            "ready"
        ).length;

    const occupiedTables =
        new Set(
            orders
                .filter((order) => {

                    const status =
                        normalizeStatus(
                            order.status
                        );

                    return (
                        order.table !== "-" &&
                        status !== "completed" &&
                        status !== "cancelled"
                    );

                })
                .map((order) =>
                    String(order.table)
                )
        ).size;

    if (statisticNumbers.length >= 4) {

        statisticNumbers[0].textContent =
            pendingOrders;

        statisticNumbers[1].textContent =
            preparingOrders;

        statisticNumbers[2].textContent =
            readyOrders;

        statisticNumbers[3].textContent =
            occupiedTables;
    }
}


/* ==========================================
   REFRESH ORDERS
========================================== */

function refreshOrders() {

    if (!refreshButton) {
        return;
    }

    const icon =
        refreshButton.querySelector("i");

    refreshButton.disabled = true;

    if (icon) {
        icon.classList.add("fa-spin");
    }

    setTimeout(() => {

        renderOrders();

        refreshButton.disabled = false;

        if (icon) {
            icon.classList.remove("fa-spin");
        }

        showToast(
            "Orders refreshed successfully."
        );

    }, 600);
}

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        refreshOrders
    );

}


/* ==========================================
   QUICK ACTION NAVIGATION
========================================== */

if (actionButtons.length >= 4) {

    // New Order
    actionButtons[0].onclick = function () {

        window.location.href =
            "../html/menu.html";

    };

    // Print Receipt
    actionButtons[1].onclick = function () {

        window.print();

    };

    // View Orders
    actionButtons[2].onclick = function () {

        window.location.href =
            "../html/orders.html";

    };

}


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    localStorage.removeItem(
        "loggedInUser"
    );

    localStorage.removeItem(
        "userRole"
    );

    localStorage.removeItem(
        "rememberUser"
    );

    showToast(
        "Logout successful."
    );

    setTimeout(() => {

        window.location.href =
            "../html/login.html";

    }, 800);
}

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}


/* ==========================================
   TOAST MESSAGE
========================================== */

let toastTimer;

function showToast(message) {

    if (!toast) {
        return;
    }

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
}


/* ==========================================
   STATUS HELPERS
========================================== */

function normalizeStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase();
}

function getStatusClass(status) {

    const normalized =
        normalizeStatus(status);

    const allowedStatuses = [
        "pending",
        "preparing",
        "ready",
        "completed",
        "cancelled"
    ];

    return allowedStatuses.includes(
        normalized
    )
        ? normalized
        : "pending";
}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatMoney(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(amount) || 0
    );
}


/* ==========================================
   SECURITY: ESCAPE HTML
========================================== */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

    return element.innerHTML;
}


/* ==========================================
   EMPLOYEE PROFILE
========================================== */

function loadEmployeeProfile() {

    const employeeName =
        document.querySelector(
            ".employee-profile h3"
        );

    const employeeRole =
        document.querySelector(
            ".employee-profile span"
        );

    const loggedInUser =
        localStorage.getItem(
            "loggedInUser"
        );

    if (
        loggedInUser &&
        employeeName
    ) {
        employeeName.textContent =
            formatEmployeeName(
                loggedInUser
            );
    }

    if (employeeRole) {

        employeeRole.textContent =
            "Employee";

    }
}

function formatEmployeeName(username) {

    return String(username)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}


/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadEmployeeProfile();

        renderOrders();

        setTimeout(() => {

            showToast(
                "Welcome back! Have a productive shift."
            );

        }, 500);

    }
);


/* ==========================================
   UPDATE DASHBOARD ACROSS TABS
========================================== */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            ORDER_STORAGE_KEY
        ) {
            renderOrders();
        }

    }
);