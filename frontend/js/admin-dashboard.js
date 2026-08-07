/* =========================================
   ALLEPPEY PUB ERP
   ADMIN DASHBOARD
========================================= */

const ORDER_KEYS = ["pubOrders", "orderHistory"];
const BILL_KEYS = ["pubBills", "billHistory"];
const INVENTORY_KEYS = ["pubInventory", "inventoryItems"];

const DEMO_ORDERS = createDemoOrders();

const DEMO_BILLS = [
    {
        id: "BILL-105",
        orderId: "ORD-1005",
        total: 1540,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        createdAt: daysAgo(0),
        items: [
            { name: "Lager Beer", quantity: 3, price: 220 },
            { name: "Chicken Wings", quantity: 2, price: 320 }
        ]
    },
    {
        id: "BILL-104",
        orderId: "ORD-1004",
        total: 1120,
        paymentMethod: "Card",
        paymentStatus: "Paid",
        createdAt: daysAgo(1),
        items: [
            { name: "Mojito", quantity: 2, price: 280 },
            { name: "Pub Burger", quantity: 1, price: 420 }
        ]
    },
    {
        id: "BILL-103",
        orderId: "ORD-1003",
        total: 760,
        paymentMethod: "Cash",
        paymentStatus: "Paid",
        createdAt: daysAgo(2),
        items: [
            { name: "Grilled Chicken", quantity: 2, price: 380 }
        ]
    },
    {
        id: "BILL-102",
        orderId: "ORD-1002",
        total: 980,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        createdAt: daysAgo(4),
        items: [
            { name: "Lager Beer", quantity: 3, price: 220 },
            { name: "Chicken Wings", quantity: 1, price: 320 }
        ]
    },
    {
        id: "BILL-101",
        orderId: "ORD-1001",
        total: 840,
        paymentMethod: "Card",
        paymentStatus: "Paid",
        createdAt: daysAgo(6),
        items: [
            { name: "Margarita", quantity: 2, price: 350 },
            { name: "French Fries", quantity: 1, price: 140 }
        ]
    }
];

const DEMO_INVENTORY = [
    {
        name: "Lager Beer",
        currentStock: 4,
        minimumStock: 8,
        unit: "Bottles"
    },
    {
        name: "Chicken Wings",
        currentStock: 3,
        minimumStock: 6,
        unit: "Portions"
    },
    {
        name: "Mojito Mix",
        currentStock: 11,
        minimumStock: 8,
        unit: "Servings"
    }
];

let dashboardData = {
    orders: [],
    bills: [],
    inventory: [],
    usingDemoData: false
};

let toastTimer;

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

function daysAgo(days) {
    const date = new Date();
    date.setHours(13, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function createDemoOrders() {
    return [
        {
            id: "ORD-1005",
            customer: "Arjun",
            table: "07",
            orderType: "Dine In",
            status: "Preparing",
            total: 1540,
            createdAt: daysAgo(0),
            items: [
                { name: "Lager Beer", quantity: 3, price: 220 },
                { name: "Chicken Wings", quantity: 2, price: 320 }
            ]
        },
        {
            id: "ORD-1004",
            customer: "Meera",
            table: "04",
            orderType: "Dine In",
            status: "Pending",
            total: 1120,
            createdAt: daysAgo(1),
            items: [
                { name: "Mojito", quantity: 2, price: 280 },
                { name: "Pub Burger", quantity: 1, price: 420 }
            ]
        },
        {
            id: "ORD-1003",
            customer: "Walk-in Customer",
            table: "-",
            orderType: "Take Away",
            status: "Completed",
            total: 760,
            createdAt: daysAgo(2),
            items: [
                { name: "Grilled Chicken", quantity: 2, price: 380 }
            ]
        },
        {
            id: "ORD-1002",
            customer: "Nikhil",
            table: "02",
            orderType: "Dine In",
            status: "Ready",
            total: 980,
            createdAt: daysAgo(4),
            items: [
                { name: "Lager Beer", quantity: 3, price: 220 },
                { name: "Chicken Wings", quantity: 1, price: 320 }
            ]
        },
        {
            id: "ORD-1001",
            customer: "Anu",
            table: "09",
            orderType: "Dine In",
            status: "Completed",
            total: 840,
            createdAt: daysAgo(6),
            items: [
                { name: "Margarita", quantity: 2, price: 350 },
                { name: "French Fries", quantity: 1, price: 140 }
            ]
        }
    ];
}

function readStoredArray(keys) {
    for (const key of keys) {
        const storedValue = localStorage.getItem(key);

        if (!storedValue) {
            continue;
        }

        try {
            const parsedValue = JSON.parse(storedValue);

            if (Array.isArray(parsedValue) && parsedValue.length) {
                return parsedValue;
            }
        } catch (error) {
            console.warn(`Unable to read ${key}:`, error);
        }
    }

    return [];
}

function loadDashboardData() {
    const savedOrders = readStoredArray(ORDER_KEYS);
    const savedBills = readStoredArray(BILL_KEYS);
    const savedInventory = readStoredArray(INVENTORY_KEYS);

    const noSavedData =
        !savedOrders.length &&
        !savedBills.length &&
        !savedInventory.length;

    dashboardData = {
        orders: noSavedData ? DEMO_ORDERS : savedOrders,
        bills: noSavedData ? DEMO_BILLS : savedBills,
        inventory: noSavedData ? DEMO_INVENTORY : savedInventory,
        usingDemoData: noSavedData
    };
}

function getText(...values) {
    const result = values.find(
        value => typeof value === "string" && value.trim()
    );

    return result ? result.trim() : "";
}

function getNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const cleaned = String(value || "").replace(/[^\d.-]/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
}

function getItems(record) {
    const items =
        record.items ||
        record.orderItems ||
        record.cart ||
        [];

    return Array.isArray(items) ? items : [];
}

function getRecordTotal(record) {
    const explicitTotal = getNumber(
        record.total ??
        record.grandTotal ??
        record.amount ??
        record.totalAmount
    );

    if (explicitTotal > 0) {
        return explicitTotal;
    }

    return getItems(record).reduce((total, item) => {
        const quantity = Math.max(
            1,
            getNumber(item.quantity ?? item.qty ?? item.count ?? 1)
        );

        const price = getNumber(
            item.price ??
            item.unitPrice ??
            item.rate
        );

        return total + quantity * price;
    }, 0);
}

function getStatus(record) {
    return getText(
        record.status,
        record.orderStatus,
        record.paymentStatus,
        record.payment_status
    ) || "Pending";
}

function getRecordDate(record) {
    const value =
        record.createdAt ||
        record.date ||
        record.orderDate ||
        record.time;

    if (!value) {
        return null;
    }

    const parsedDate = new Date(value);

    return Number.isNaN(parsedDate.getTime())
        ? null
        : parsedDate;
}

function getLowStockItems() {
    return dashboardData.inventory.filter(item => {
        const currentStock = getNumber(
            item.currentStock ??
            item.current_stock ??
            item.stock ??
            item.quantity
        );

        const minimumStock = getNumber(
            item.minimumStock ??
            item.minimum_stock ??
            item.minStock ??
            item.reorderLevel
        );

        return (
            currentStock <= 0 ||
            (minimumStock > 0 && currentStock <= minimumStock)
        );
    });
}

function getPaidBills() {
    return dashboardData.bills.filter(bill => {
        const status = getStatus(bill).toLowerCase();

        return (
            !status ||
            status.includes("paid") ||
            status.includes("complete") ||
            status.includes("success")
        );
    });
}

function getRevenueRecords() {
    const paidBills = getPaidBills();

    if (paidBills.length) {
        return paidBills;
    }

    return dashboardData.orders.filter(order => {
        const status = getStatus(order).toLowerCase();

        return (
            status.includes("complete") ||
            status.includes("deliver") ||
            status.includes("served")
        );
    });
}

function formatMoney(value, compact = false) {
    if (compact && value >= 1000) {
        return `₹${new Intl.NumberFormat("en-IN", {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(value)}`;
    }

    return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function animateNumber(element, target, formatter = value => String(value)) {
    const safeTarget = Math.max(0, Number(target) || 0);
    const duration = 650;
    const startTime = performance.now();

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = safeTarget * easedProgress;

        element.textContent = formatter(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function renderSummary() {
    const revenueRecords = getRevenueRecords();
    const revenue = revenueRecords.reduce(
        (total, record) => total + getRecordTotal(record),
        0
    );

    const openStatuses = ["pending", "preparing", "ready"];
    const openOrders = dashboardData.orders.filter(order => {
        const status = getStatus(order).toLowerCase();
        return openStatuses.some(openStatus => status.includes(openStatus));
    });

    const lowStockItems = getLowStockItems();

    animateNumber(
        elements.totalRevenue,
        revenue,
        value => formatMoney(value)
    );

    animateNumber(
        elements.totalOrders,
        dashboardData.orders.length,
        value => Math.round(value).toLocaleString("en-IN")
    );

    animateNumber(
        elements.pendingOrders,
        openOrders.length,
        value => String(Math.round(value))
    );

    animateNumber(
        elements.lowStockTotal,
        lowStockItems.length,
        value => String(Math.round(value))
    );

    elements.revenueDescription.textContent =
        getPaidBills().length
            ? `From ${getPaidBills().length} paid bill${getPaidBills().length === 1 ? "" : "s"}`
            : "From completed orders";

    const customerNames = new Set(
        dashboardData.orders
            .map(order => getText(
                order.customer,
                order.customerName,
                order.phone
            ))
            .filter(name => name && name !== "Walk-in Customer")
    );

    elements.ordersDescription.textContent =
        `${customerNames.size} identified customer${customerNames.size === 1 ? "" : "s"}`;

    elements.sidebarOrderCount.textContent = String(openOrders.length);
    elements.sidebarStockCount.textContent = String(lowStockItems.length);

    const alertCount = openOrders.length + lowStockItems.length;
    elements.notificationCount.textContent = String(alertCount);
    elements.notificationCount.dataset.count = String(alertCount);
}

function renderSalesChart() {
    elements.salesChartBars.replaceChildren();

    const revenueRecords = getRevenueRecords();
    const dateEntries = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);

        dateEntries.push({
            date,
            label: date.toLocaleDateString("en-IN", { weekday: "short" }),
            total: 0
        });
    }

    revenueRecords.forEach(record => {
        const recordDate = getRecordDate(record) || new Date();
        recordDate.setHours(0, 0, 0, 0);

        const matchingDay = dateEntries.find(entry => {
            return entry.date.getTime() === recordDate.getTime();
        });

        if (matchingDay) {
            matchingDay.total += getRecordTotal(record);
        }
    });

    const maximum = Math.max(
        ...dateEntries.map(entry => entry.total),
        1
    );

    dateEntries.forEach(entry => {
        const column = document.createElement("div");
        column.className = "chart-column";

        const value = document.createElement("span");
        value.className = "chart-value";
        value.textContent = formatMoney(entry.total, true);

        const track = document.createElement("div");
        track.className = "chart-track";
        track.title = `${entry.label}: ${formatMoney(entry.total)}`;

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height =
            `${Math.max(entry.total ? 7 : 2, (entry.total / maximum) * 100)}%`;

        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = entry.label;

        track.appendChild(bar);
        column.append(value, track, label);
        elements.salesChartBars.appendChild(column);
    });
}

function renderRecentOrders() {
    elements.recentOrdersBody.replaceChildren();

    const recentOrders = [...dashboardData.orders]
        .sort((first, second) => {
            const firstDate = getRecordDate(first)?.getTime() || 0;
            const secondDate = getRecordDate(second)?.getTime() || 0;
            return secondDate - firstDate;
        })
        .slice(0, 5);

    elements.ordersEmptyState.classList.toggle(
        "show",
        recentOrders.length === 0
    );

    recentOrders.forEach((order, index) => {
        const row = document.createElement("tr");
        const status = getStatus(order);
        const orderId = getText(
            order.orderId,
            String(order.id || "")
        ) || `ORD-${index + 1}`;

        const values = [
            orderId.startsWith("#") ? orderId : `#${orderId}`,
            getText(order.customer, order.customerName) || "Walk-in Customer",
            (
                getText(order.orderType, order.order_type, order.type) ||
                (
                    order.table || order.tableNumber
                        ? `Table ${order.table || order.tableNumber}`
                        : "Dine In"
                )
            )
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className =
            `status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`;
        statusBadge.textContent = status;
        statusCell.appendChild(statusBadge);

        const totalCell = document.createElement("td");
        totalCell.textContent = formatMoney(getRecordTotal(order));

        row.append(statusCell, totalCell);
        elements.recentOrdersBody.appendChild(row);
    });
}

function renderInventoryAlerts() {
    elements.inventoryAlertList.replaceChildren();

    const lowStockItems = getLowStockItems()
        .sort((first, second) => {
            const firstStock = getNumber(
                first.currentStock ?? first.current_stock ?? first.stock
            );
            const secondStock = getNumber(
                second.currentStock ?? second.current_stock ?? second.stock
            );
            return firstStock - secondStock;
        })
        .slice(0, 4);

    elements.inventoryEmptyState.classList.toggle(
        "show",
        lowStockItems.length === 0
    );

    lowStockItems.forEach(item => {
        const currentStock = getNumber(
            item.currentStock ??
            item.current_stock ??
            item.stock ??
            item.quantity
        );

        const minimumStock = getNumber(
            item.minimumStock ??
            item.minimum_stock ??
            item.minStock ??
            item.reorderLevel
        );

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
        name.textContent = getText(item.name, item.itemName) || "Inventory Item";
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

    const quantityByItem = new Map();

    dashboardData.orders.forEach(order => {
        getItems(order).forEach(item => {
            const name = getText(
                item.name,
                item.itemName,
                item.productName
            ) || "Item";

            const quantity = Math.max(
                1,
                getNumber(item.quantity ?? item.qty ?? item.count ?? 1)
            );

            quantityByItem.set(
                name,
                (quantityByItem.get(name) || 0) + quantity
            );
        });
    });

    const popularItems = [...quantityByItem.entries()]
        .sort((first, second) => second[1] - first[1])
        .slice(0, 4);

    elements.popularItemsEmptyState.classList.toggle(
        "show",
        popularItems.length === 0
    );

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

        const itemQuantity = document.createElement("span");
        itemQuantity.className = "popular-count";
        itemQuantity.textContent = `${quantity} sold`;

        container.append(rank, copy, itemQuantity);
        elements.popularItemsList.appendChild(container);
    });
}

function renderUserDetails() {
    const username =
        localStorage.getItem("loggedInUser") ||
        "Administrator";

    const formattedUsername =
        username.charAt(0).toUpperCase() +
        username.slice(1);

    elements.welcomeHeading.textContent =
        `Welcome back, ${formattedUsername}`;

    elements.sidebarUsername.textContent =
        formattedUsername;
}

function renderDataMode() {
    elements.dataMode.classList.add("show");
    elements.dataMode.querySelector("span").textContent =
        dashboardData.usingDemoData
            ? "Demo data is shown until orders, bills or inventory are recorded."
            : "Live LocalStorage data loaded successfully.";
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

function refreshDashboard(showMessage = true) {
    loadDashboardData();
    renderDashboard();

    if (showMessage) {
        showToast("Dashboard data refreshed.");
    }
}

function updateClock() {
    const now = new Date();

    elements.liveClock.textContent = now.toLocaleString("en-IN", {
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

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 2700);
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
        if (elements.sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    elements.mobileOverlay.addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar .nav-link").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    elements.refreshDashboardBtn.addEventListener(
        "click",
        () => refreshDashboard(true)
    );

    elements.notificationBtn.addEventListener("click", () => {
        const lowStockCount = getLowStockItems().length;
        const openOrderCount = dashboardData.orders.filter(order => {
            return ["pending", "preparing", "ready"].some(status => {
                return getStatus(order).toLowerCase().includes(status);
            });
        }).length;

        if (!lowStockCount && !openOrderCount) {
            showToast("No urgent dashboard alerts.");
            return;
        }

        showToast(
            `${openOrderCount} open order${openOrderCount === 1 ? "" : "s"} and ` +
            `${lowStockCount} stock alert${lowStockCount === 1 ? "" : "s"}.`
        );
    });

    elements.printDashboardBtn.addEventListener(
        "click",
        () => window.print()
    );

    elements.logoutBtn.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("adminLoggedIn");

        showToast("Logging out...");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 700);
    });

    window.addEventListener("storage", () => {
        refreshDashboard(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    });
}

function checkAccess() {
    const role = localStorage.getItem("userRole");

    if (role && role !== "admin") {
        window.location.href = "login.html";
    }
}

function initializeDashboard() {
    checkAccess();
    loadDashboardData();
    renderDashboard();
    initializeEvents();
    updateClock();
    setInterval(updateClock, 1000);
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
