/* =========================================
   ALLEPPEY PUB ERP
   REPORTS & ANALYTICS
========================================= */

const ORDER_STORAGE_KEY = "pubOrders";
const BILL_STORAGE_KEY = "pubBills";
const INVENTORY_STORAGE_KEY = "pubInventory";
const REPORT_REFRESH_INTERVAL = 30000;

let orders = [];
let bills = [];
let inventoryItems = [];
let savedBills = [];

let filteredBills = [];
let filteredOrders = [];

let selectedPeriod = "today";

let customStartDate = null;
let customEndDate = null;

let revenueChartInstance = null;
let paymentMethodChartInstance = null;
let orderStatusChartInstance = null;
let orderTypeChartInstance = null;
let topItemsChartInstance = null;

let toastTimer;


/* =========================================
   HEADER AND FILTER ELEMENTS
========================================= */

const refreshReportsBtn =
    document.getElementById("refreshReportsBtn");

const exportReportBtn =
    document.getElementById("exportReportBtn");

const periodButtons =
    document.querySelectorAll(".period-btn");

const startDateInput =
    document.getElementById("startDate");

const endDateInput =
    document.getElementById("endDate");

const applyCustomDateBtn =
    document.getElementById("applyCustomDateBtn");

const backDashboardBtn =
    document.getElementById("backDashboardBtn");

const reportDataStatus =
    document.getElementById("reportDataStatus");


/* =========================================
   MAIN STATISTICS
========================================= */

const totalRevenueElement =
    document.getElementById("totalRevenue");

const totalBillsElement =
    document.getElementById("totalBills");

const totalOrdersElement =
    document.getElementById("totalOrders");

const averageBillValueElement =
    document.getElementById("averageBillValue");

const revenueChangeElement =
    document.getElementById("revenueChange");

const billsChangeElement =
    document.getElementById("billsChange");

const ordersChangeElement =
    document.getElementById("ordersChange");

const averageChangeElement =
    document.getElementById("averageChange");


/* =========================================
   SECONDARY STATISTICS
========================================= */

const paidBillsCount =
    document.getElementById("paidBillsCount");

const pendingBillsCount =
    document.getElementById("pendingBillsCount");

const itemsSoldCount =
    document.getElementById("itemsSoldCount");

const stockAlertCount =
    document.getElementById("stockAlertCount");


/* =========================================
   CHART ELEMENTS
========================================= */

const revenueChartCanvas =
    document.getElementById("revenueChart");

const paymentMethodChartCanvas =
    document.getElementById("paymentMethodChart");

const orderStatusChartCanvas =
    document.getElementById("orderStatusChart");

const orderTypeChartCanvas =
    document.getElementById("orderTypeChart");

const topItemsChartCanvas =
    document.getElementById("topItemsChart");

const chartRevenueTotal =
    document.getElementById("chartRevenueTotal");

const paymentMethodLegend =
    document.getElementById("paymentMethodLegend");


/* =========================================
   POPULAR ITEMS TABLE
========================================= */

const popularItemsBody =
    document.getElementById("popularItemsBody");

const popularItemsCount =
    document.getElementById("popularItemsCount");

const popularItemsEmpty =
    document.getElementById("popularItemsEmpty");


/* =========================================
   STOCK ALERTS TABLE
========================================= */

const stockAlertsBody =
    document.getElementById("stockAlertsBody");

const stockAlertsEmpty =
    document.getElementById("stockAlertsEmpty");


/* =========================================
   TRANSACTIONS
========================================= */

const transactionSearch =
    document.getElementById("transactionSearch");

const transactionStatusFilter =
    document.getElementById("transactionStatusFilter");

const transactionsBody =
    document.getElementById("transactionsBody");

const transactionsEmptyState =
    document.getElementById("transactionsEmptyState");


/* =========================================
   BUSINESS INSIGHTS
========================================= */

const revenueInsight =
    document.getElementById("revenueInsight");

const productInsight =
    document.getElementById("productInsight");

const paymentInsight =
    document.getElementById("paymentInsight");

const inventoryInsight =
    document.getElementById("inventoryInsight");


/* =========================================
   EXPORT MODAL
========================================= */

const exportReportModal =
    document.getElementById("exportReportModal");

const closeExportModalBtn =
    document.getElementById("closeExportModal");

const cancelExportModalBtn =
    document.getElementById("cancelExportModal");

const confirmExportBtn =
    document.getElementById("confirmExportBtn");

const exportPeriodText =
    document.getElementById("exportPeriodText");

const exportTransactionCount =
    document.getElementById("exportTransactionCount");

const exportRevenueTotal =
    document.getElementById("exportRevenueTotal");


/* =========================================
   TOAST
========================================= */

const toast =
    document.getElementById("toast");


/* =========================================
   DEFAULT SAMPLE DATA
========================================= */

const defaultOrders = [

    {
        id: "ORD-1001",
        customer: "Aneesh",
        table: "T-01",
        orderType: "Dine In",
        status: "Paid",
        time: new Date().toISOString(),
        items: [
            {
                id: 1,
                name: "Lager Beer",
                price: 220,
                quantity: 2
            },
            {
                id: 2,
                name: "Pub Burger",
                price: 420,
                quantity: 1
            }
        ]
    },

    {
        id: "ORD-1002",
        customer: "Rahul",
        table: "T-04",
        orderType: "Dine In",
        status: "Ready",
        time: new Date().toISOString(),
        items: [
            {
                id: 3,
                name: "Mojito",
                price: 350,
                quantity: 2
            },
            {
                id: 4,
                name: "Chicken Wings",
                price: 390,
                quantity: 1
            }
        ]
    },

    {
        id: "ORD-1003",
        customer: "Walk-in Customer",
        table: "Takeaway",
        orderType: "Takeaway",
        status: "Pending",
        time: new Date().toISOString(),
        items: [
            {
                id: 5,
                name: "Pub Burger",
                price: 420,
                quantity: 2
            }
        ]
    }

];


const defaultBills = [

    {
        id: "BILL-5001",
        orderId: "ORD-1001",
        customer: "Aneesh",
        table: "T-01",
        orderType: "Dine In",
        items: [
            {
                id: 1,
                name: "Lager Beer",
                price: 220,
                quantity: 2
            },
            {
                id: 2,
                name: "Pub Burger",
                price: 420,
                quantity: 1
            }
        ],
        subtotal: 860,
        discount: 0,
        gst: 43,
        serviceCharge: 0,
        total: 903,
        paymentMethod: "Cash",
        paymentStatus: "Paid",
        createdAt: new Date().toISOString()
    },

    {
        id: "BILL-5002",
        orderId: "ORD-1002",
        customer: "Rahul",
        table: "T-04",
        orderType: "Dine In",
        items: [
            {
                id: 3,
                name: "Mojito",
                price: 350,
                quantity: 2
            },
            {
                id: 4,
                name: "Chicken Wings",
                price: 390,
                quantity: 1
            }
        ],
        subtotal: 1090,
        discount: 50,
        gst: 52,
        serviceCharge: 0,
        total: 1092,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        createdAt: new Date().toISOString()
    }

];


/* =========================================
   ADMIN ACCESS AND LIVE API
========================================= */

function checkAdminAccess() {

    const role = localStorage.getItem("userRole");

    const loggedIn =
        localStorage.getItem("adminLoggedIn") === "true" ||
        sessionStorage.getItem("adminLoggedIn") === "true";

    if (role !== "admin" || !loggedIn) {
        window.location.replace("role-selection.html");
        return false;
    }

    return true;

}


function getApiBaseUrl() {

    const baseUrl =
        String(window.PUB_API_BASE_URL || "")
            .replace(/\/+$/, "");

    if (!baseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return baseUrl;

}


async function apiRequest(path) {

    const response = await fetch(
        `${getApiBaseUrl()}${path}`,
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
        console.error("The server response could not be read.", error);
    }

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            `Server error ${response.status}`
        );
    }

    return Array.isArray(result) ? result : [];

}


async function refreshReportsFromApi(showMessage = true) {

    if (refreshReportsBtn.disabled) {
        return false;
    }

    refreshReportsBtn.disabled = true;
    refreshReportsBtn.querySelector("i")
        ?.classList.add("fa-spin");

    try {

        const [liveOrders, liveInventory, liveBills] =
            await Promise.all([
                apiRequest("/orders"),
                apiRequest("/inventory"),
                apiRequest("/bills")
            ]);

        orders = liveOrders.map(normalizeOrder);
        inventoryItems = liveInventory.map(normalizeInventoryItem);
        bills = liveBills.map(normalizeBill);
        savedBills = [...bills];

        localStorage.setItem(
            ORDER_STORAGE_KEY,
            JSON.stringify(orders)
        );

        localStorage.setItem(
            INVENTORY_STORAGE_KEY,
            JSON.stringify(inventoryItems)
        );

        localStorage.setItem(
            BILL_STORAGE_KEY,
            JSON.stringify(bills)
        );

        updateDashboard();
        showReportDataStatus(false);

        if (showMessage) {
            showToast("Reports refreshed from the database.", "success");
        }

        return true;

    } catch (error) {

        console.error("Unable to refresh live reports.", error);
        loadReportsData();
        updateDashboard();
        showReportDataStatus(true);

        if (showMessage) {
            showToast("Server unavailable. Showing saved report data.", "error");
        }

        return false;

    } finally {

        refreshReportsBtn.disabled = false;
        refreshReportsBtn.querySelector("i")
            ?.classList.remove("fa-spin");

    }

}


function readSavedBills() {

    try {
        const value = JSON.parse(
            localStorage.getItem(BILL_STORAGE_KEY)
        );

        return Array.isArray(value)
            ? value.map(normalizeBill)
            : [];
    } catch (error) {
        console.warn("Saved bills could not be read.", error);
        return [];
    }

}


function mergeBillsWithCompletedOrders(localBills, orderRecords) {

    const billedOrderIds = new Set(
        localBills.map(bill => bill.orderId)
    );

    const databaseBills = orderRecords
        .filter(order => {
            const status = String(order.status).toLowerCase();
            return (
                ["completed", "paid"].includes(status) &&
                !billedOrderIds.has(order.id)
            );
        })
        .map(order => normalizeBill({
            id: `LIVE-${order.id}`,
            orderId: order.id,
            customer: order.customer,
            table: order.table,
            orderType: order.orderType,
            items: order.items,
            subtotal: order.subtotal,
            discount: order.discount,
            gst: order.gst,
            serviceCharge: order.serviceCharge,
            total: order.total || calculateOrderValue(order.items),
            paymentMethod: order.payment,
            paymentStatus: "Paid",
            createdAt: order.time
        }));

    return [...localBills, ...databaseBills];

}


function calculateOrderValue(items) {

    return items.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

}


function showReportDataStatus(usingCache) {

    if (usingCache) {
        reportDataStatus.textContent =
            "Saved data - backend currently unavailable";
        reportDataStatus.classList.add("offline");
        return;
    }

    const time = new Date().toLocaleTimeString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit" }
    );

    reportDataStatus.textContent =
        `Live database - updated ${time}`;
    reportDataStatus.classList.remove("offline");

}


/* =========================================
   LOAD DATA
========================================= */

function loadReportsData() {

    try {

        const savedOrders =
            JSON.parse(
                localStorage.getItem(
                    ORDER_STORAGE_KEY
                )
            );

        const storedBills =
            JSON.parse(
                localStorage.getItem(
                    BILL_STORAGE_KEY
                )
            );

        const savedInventory =
            JSON.parse(
                localStorage.getItem(
                    INVENTORY_STORAGE_KEY
                )
            );


        orders =
            Array.isArray(savedOrders)
                ? savedOrders.map(normalizeOrder)
                : [];


        savedBills =
            Array.isArray(storedBills)
                ? storedBills.map(normalizeBill)
                : [];


        inventoryItems =
            Array.isArray(savedInventory)
                ? savedInventory.map(
                    normalizeInventoryItem
                )
                : [];


        bills = mergeBillsWithCompletedOrders(
            savedBills,
            orders
        );

    } catch (error) {

        console.error(
            "Unable to load reports data:",
            error
        );

        orders = [];

        savedBills = [];

        bills = [];

        inventoryItems = [];

    }

}


/* =========================================
   NORMALIZE DATA
========================================= */

function normalizeOrder(order) {

    return {

        id:
            String(
                order.id ||
                order.orderId ||
                "ORD-UNKNOWN"
            ),

        customer:
            String(
                order.customer ||
                order.customerName ||
                "Walk-in Customer"
            ),

        table:
            String(
                order.table ||
                order.tableNumber ||
                "N/A"
            ),

        orderType:
            String(
                order.orderType ||
                order.type ||
                "Dine In"
            ),

        status:
            String(
                order.status ||
                "Pending"
            ),

        time:
            order.time ||
            order.createdAt ||
            order.date ||
            new Date().toISOString(),

        payment:
            String(
                order.payment ||
                "Cash"
            ),

        subtotal:
            Number(order.subtotal) || 0,

        discount:
            Number(order.discount) || 0,

        gst:
            Number(order.gst) || 0,

        serviceCharge:
            Number(order.serviceCharge) || 0,

        total:
            Number(order.total) || 0,

        items:
            Array.isArray(order.items)
                ? order.items.map(
                    normalizeItem
                )
                : []

    };

}


function normalizeBill(bill) {

    return {

        id:
            String(
                bill.id ||
                bill.billId ||
                "BILL-UNKNOWN"
            ),

        orderId:
            String(
                bill.orderId ||
                "Manual"
            ),

        customer:
            String(
                bill.customer ||
                bill.customerName ||
                "Walk-in Customer"
            ),

        table:
            String(
                bill.table ||
                bill.tableNumber ||
                "N/A"
            ),

        orderType:
            String(
                bill.orderType ||
                "Dine In"
            ),

        items:
            Array.isArray(bill.items)
                ? bill.items.map(
                    normalizeItem
                )
                : [],

        subtotal:
            Number(bill.subtotal) || 0,

        discount:
            Number(bill.discount) || 0,

        gst:
            Number(bill.gst) || 0,

        serviceCharge:
            Number(bill.serviceCharge) || 0,

        total:
            Number(bill.total) || 0,

        paymentMethod:
            String(
                bill.paymentMethod ||
                "Cash"
            ),

        paymentStatus:
            String(
                bill.paymentStatus ||
                bill.status ||
                "Pending"
            ),

        createdAt:
            bill.createdAt ||
            bill.date ||
            new Date().toISOString()

    };

}


function normalizeItem(item) {

    return {

        id:
            item.id ||
            Date.now(),

        name:
            String(
                item.name ||
                item.itemName ||
                "Item"
            ),

        price:
            Number(item.price) || 0,

        quantity:
            Number(item.quantity ?? item.qty) || 1

    };

}


function normalizeInventoryItem(item) {

    return {

        id:
            item.id ||
            Date.now(),

        name:
            String(
                item.name ||
                "Inventory Item"
            ),

        currentStock:
            Number(item.currentStock) || 0,

        minimumStock:
            Number(item.minimumStock) || 0,

        unit:
            String(
                item.unit ||
                "Unit"
            )

    };

}


/* =========================================
   PERIOD FILTERING
========================================= */

function updateFilteredData() {

    filteredBills =
        bills.filter(bill => {

            return isDateInSelectedPeriod(
                bill.createdAt
            );

        });


    filteredOrders =
        orders.filter(order => {

            return isDateInSelectedPeriod(
                order.time
            );

        });

}


function isDateInSelectedPeriod(value) {

    const itemDate =
        new Date(value);

    if (
        Number.isNaN(
            itemDate.getTime()
        )
    ) {

        return false;

    }


    const now =
        new Date();


    if (selectedPeriod === "all") {

        return true;

    }


    if (selectedPeriod === "custom") {

        if (
            !customStartDate ||
            !customEndDate
        ) {

            return true;

        }

        return (
            itemDate >= customStartDate &&
            itemDate <= customEndDate
        );

    }


    if (selectedPeriod === "today") {

        return (
            itemDate.toDateString() ===
            now.toDateString()
        );

    }


    if (selectedPeriod === "week") {

        const weekStart =
            getStartOfWeek(now);

        const weekEnd =
            new Date(weekStart);

        weekEnd.setDate(
            weekEnd.getDate() + 7
        );

        return (
            itemDate >= weekStart &&
            itemDate < weekEnd
        );

    }


    if (selectedPeriod === "month") {

        return (
            itemDate.getFullYear() ===
                now.getFullYear()

            &&

            itemDate.getMonth() ===
                now.getMonth()
        );

    }


    if (selectedPeriod === "year") {

        return (
            itemDate.getFullYear() ===
            now.getFullYear()
        );

    }


    return true;

}


function getStartOfWeek(date) {

    const result =
        new Date(date);

    const day =
        result.getDay();

    const difference =
        result.getDate() -
        day +
        (day === 0 ? -6 : 1);

    result.setDate(difference);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;

}


/* =========================================
   UPDATE DASHBOARD
========================================= */

function updateDashboard() {

    updateFilteredData();

    updateMainStatistics();

    updateSecondaryStatistics();

    renderAllCharts();

    renderPopularItems();

    renderStockAlerts();

    renderTransactions();

    updateBusinessInsights();

    updateExportSummary();

}


/* =========================================
   MAIN STATISTICS
========================================= */

function updateMainStatistics() {

    const paidBills =
        filteredBills.filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        );


    const totalRevenue =
        paidBills.reduce(
            (total, bill) =>
                total + bill.total,
            0
        );


    const totalBills =
        filteredBills.length;


    const totalOrders =
        filteredOrders.length;


    const averageBillValue =
        paidBills.length > 0
            ? totalRevenue /
                paidBills.length
            : 0;


    totalRevenueElement.textContent =
        formatMoney(totalRevenue);

    totalBillsElement.textContent =
        totalBills;

    totalOrdersElement.textContent =
        totalOrders;

    averageBillValueElement.textContent =
        formatMoney(
            averageBillValue
        );


    chartRevenueTotal.textContent =
        formatMoney(totalRevenue);


    updateComparisonValues();

}


/* =========================================
   COMPARISON VALUES
========================================= */

function updateComparisonValues() {

    const currentRevenue =
        filteredBills
            .filter(
                bill =>
                    bill.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (total, bill) =>
                    total + bill.total,
                0
            );


    const previousRange =
        getPreviousPeriodRange();


    const previousBills =
        bills.filter(bill => {

            if (!previousRange) {

                return false;

            }

            const date =
                new Date(
                    bill.createdAt
                );

            return (
                date >= previousRange.start &&
                date <= previousRange.end
            );

        });


    const previousOrders =
        orders.filter(order => {

            if (!previousRange) {

                return false;

            }

            const date =
                new Date(order.time);

            return (
                date >= previousRange.start &&
                date <= previousRange.end
            );

        });


    const previousRevenue =
        previousBills
            .filter(
                bill =>
                    bill.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (total, bill) =>
                    total + bill.total,
                0
            );


    const currentAverage =
        filteredBills.length > 0
            ? currentRevenue /
                filteredBills.length
            : 0;


    const previousAverage =
        previousBills.length > 0
            ? previousRevenue /
                previousBills.length
            : 0;


    updateChangeBadge(
        revenueChangeElement,
        calculatePercentageChange(
            currentRevenue,
            previousRevenue
        )
    );

    updateChangeBadge(
        billsChangeElement,
        calculatePercentageChange(
            filteredBills.length,
            previousBills.length
        )
    );

    updateChangeBadge(
        ordersChangeElement,
        calculatePercentageChange(
            filteredOrders.length,
            previousOrders.length
        )
    );

    updateChangeBadge(
        averageChangeElement,
        calculatePercentageChange(
            currentAverage,
            previousAverage
        )
    );

}


function getPreviousPeriodRange() {

    const now =
        new Date();


    if (selectedPeriod === "today") {

        const start =
            new Date(now);

        start.setDate(
            start.getDate() - 1
        );

        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(start);

        end.setHours(
            23,
            59,
            59,
            999
        );

        return { start, end };

    }


    if (selectedPeriod === "week") {

        const currentStart =
            getStartOfWeek(now);

        const end =
            new Date(currentStart);

        end.setMilliseconds(-1);


        const start =
            new Date(currentStart);

        start.setDate(
            start.getDate() - 7
        );

        return { start, end };

    }


    if (selectedPeriod === "month") {

        const start =
            new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            );

        const end =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                0,
                23,
                59,
                59,
                999
            );

        return { start, end };

    }


    if (selectedPeriod === "year") {

        const start =
            new Date(
                now.getFullYear() - 1,
                0,
                1
            );

        const end =
            new Date(
                now.getFullYear() - 1,
                11,
                31,
                23,
                59,
                59,
                999
            );

        return { start, end };

    }


    return null;

}


function calculatePercentageChange(
    currentValue,
    previousValue
) {

    if (previousValue === 0) {

        return currentValue > 0
            ? 100
            : 0;

    }

    return (
        (
            currentValue -
            previousValue
        ) /
        previousValue
    ) * 100;

}


function updateChangeBadge(
    element,
    value
) {

    const roundedValue =
        Math.round(value);

    element.textContent =
        `${roundedValue >= 0 ? "+" : ""}${roundedValue}%`;

    element.classList.remove(
        "positive",
        "negative"
    );

    element.classList.add(
        roundedValue >= 0
            ? "positive"
            : "negative"
    );

}


/* =========================================
   SECONDARY STATISTICS
========================================= */

function updateSecondaryStatistics() {

    const paidCount =
        filteredBills.filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        ).length;


    const pendingCount =
        filteredBills.filter(
            bill =>
                bill.paymentStatus ===
                    "Pending"

                ||

                bill.paymentStatus ===
                    "Partially Paid"
        ).length;


    const itemsSold =
        filteredBills.reduce(
            (total, bill) => {

                return total +
                    bill.items.reduce(
                        (
                            itemTotal,
                            item
                        ) => {

                            return (
                                itemTotal +
                                item.quantity
                            );

                        },
                        0
                    );

            },
            0
        );


    const stockAlerts =
        inventoryItems.filter(
            item =>
                item.currentStock <=
                item.minimumStock
        ).length;


    paidBillsCount.textContent =
        paidCount;

    pendingBillsCount.textContent =
        pendingCount;

    itemsSoldCount.textContent =
        itemsSold;

    stockAlertCount.textContent =
        stockAlerts;

}


/* =========================================
   CHART DEFAULT SETTINGS
========================================= */

function configureChartDefaults() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;

    }


    Chart.defaults.color =
        "#b8b8b8";

    Chart.defaults.borderColor =
        "rgba(255, 255, 255, 0.08)";

    Chart.defaults.font.family =
        "Poppins";

}


/* =========================================
   RENDER ALL CHARTS
========================================= */

function renderAllCharts() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }

    renderRevenueChart();

    renderPaymentMethodChart();

    renderOrderStatusChart();

    renderOrderTypeChart();

    renderTopItemsChart();

}


/* =========================================
   REVENUE CHART
========================================= */

function renderRevenueChart() {

    const revenueData =
        createRevenueChartData();


    if (revenueChartInstance) {

        revenueChartInstance.destroy();

    }


    const context =
        revenueChartCanvas.getContext(
            "2d"
        );


    const gradient =
        context.createLinearGradient(
            0,
            0,
            0,
            350
        );

    gradient.addColorStop(
        0,
        "rgba(212, 175, 55, 0.35)"
    );

    gradient.addColorStop(
        1,
        "rgba(212, 175, 55, 0.01)"
    );


    revenueChartInstance =
        new Chart(
            context,
            {
                type: "line",

                data: {
                    labels:
                        revenueData.labels,

                    datasets: [
                        {
                            label: "Revenue",

                            data:
                                revenueData.values,

                            borderColor:
                                "#d4af37",

                            backgroundColor:
                                gradient,

                            fill: true,

                            tension: 0.38,

                            borderWidth: 2,

                            pointRadius: 4,

                            pointHoverRadius: 6,

                            pointBackgroundColor:
                                "#f2d66c",

                            pointBorderColor:
                                "#111111",

                            pointBorderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            `Revenue: \u20B9${formatMoney(
                                                context.raw
                                            )}`
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback:
                                    function (
                                        value
                                    ) {

                                        return `\u20B9${value}`;

                                    }

                            }

                        }

                    }

                }
            }
        );

}


function createRevenueChartData() {

    if (selectedPeriod === "today") {

        return createHourlyRevenueData();

    }


    if (selectedPeriod === "week") {

        return createWeeklyRevenueData();

    }


    if (selectedPeriod === "month") {

        return createMonthlyRevenueData();

    }


    if (selectedPeriod === "year") {

        return createYearlyRevenueData();

    }


    return createAllTimeRevenueData();

}


function createHourlyRevenueData() {

    const labels = [
        "8 AM",
        "10 AM",
        "12 PM",
        "2 PM",
        "4 PM",
        "6 PM",
        "8 PM",
        "10 PM",
        "12 AM"
    ];

    const values =
        new Array(
            labels.length
        ).fill(0);


    filteredBills
        .filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        )
        .forEach(bill => {

            const hour =
                new Date(
                    bill.createdAt
                ).getHours();

            let index = 0;

            if (hour >= 24) index = 8;
            else if (hour >= 22) index = 7;
            else if (hour >= 20) index = 6;
            else if (hour >= 18) index = 5;
            else if (hour >= 16) index = 4;
            else if (hour >= 14) index = 3;
            else if (hour >= 12) index = 2;
            else if (hour >= 10) index = 1;

            values[index] += bill.total;

        });


    return {
        labels,
        values
    };

}


function createWeeklyRevenueData() {

    const labels = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];

    const values =
        new Array(7).fill(0);


    filteredBills
        .filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        )
        .forEach(bill => {

            const day =
                new Date(
                    bill.createdAt
                ).getDay();

            const index =
                day === 0
                    ? 6
                    : day - 1;

            values[index] += bill.total;

        });


    return {
        labels,
        values
    };

}


function createMonthlyRevenueData() {

    const daysInMonth =
        new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).getDate();


    const labels = [];

    const values = [];


    for (
        let start = 1;
        start <= daysInMonth;
        start += 5
    ) {

        const end =
            Math.min(
                start + 4,
                daysInMonth
            );

        labels.push(
            `${start}-${end}`
        );

        values.push(0);

    }


    filteredBills
        .filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        )
        .forEach(bill => {

            const day =
                new Date(
                    bill.createdAt
                ).getDate();

            const index =
                Math.floor(
                    (day - 1) / 5
                );

            if (
                values[index] !==
                undefined
            ) {

                values[index] +=
                    bill.total;

            }

        });


    return {
        labels,
        values
    };

}


function createYearlyRevenueData() {

    const labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    const values =
        new Array(12).fill(0);


    filteredBills
        .filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        )
        .forEach(bill => {

            const month =
                new Date(
                    bill.createdAt
                ).getMonth();

            values[month] += bill.total;

        });


    return {
        labels,
        values
    };

}


function createAllTimeRevenueData() {

    const monthMap = {};


    filteredBills
        .filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        )
        .forEach(bill => {

            const date =
                new Date(
                    bill.createdAt
                );

            const key =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );

            monthMap[key] =
                (monthMap[key] || 0) +
                bill.total;

        });


    const labels =
        Object.keys(monthMap);

    const values =
        Object.values(monthMap);


    return {
        labels:
            labels.length > 0
                ? labels
                : ["No Data"],

        values:
            values.length > 0
                ? values
                : [0]
    };

}


/* =========================================
   PAYMENT METHOD CHART
========================================= */

function renderPaymentMethodChart() {

    const methodMap = {};


    filteredBills.forEach(bill => {

        const method =
            bill.paymentMethod ||
            "Other";

        methodMap[method] =
            (methodMap[method] || 0) +
            bill.total;

    });


    const labels =
        Object.keys(methodMap);

    const values =
        Object.values(methodMap);


    const colors = [
        "#d4af37",
        "#45ad73",
        "#4f91ce",
        "#9364c7",
        "#d99b32",
        "#d9534f"
    ];


    if (paymentMethodChartInstance) {

        paymentMethodChartInstance.destroy();

    }


    paymentMethodChartInstance =
        new Chart(
            paymentMethodChartCanvas,
            {
                type: "doughnut",

                data: {

                    labels:
                        labels.length > 0
                            ? labels
                            : ["No Data"],

                    datasets: [
                        {
                            data:
                                values.length > 0
                                    ? values
                                    : [1],

                            backgroundColor:
                                colors,

                            borderColor:
                                "#111111",

                            borderWidth: 3,

                            hoverOffset: 8
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "68%",

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        if (
                                            labels.length ===
                                            0
                                        ) {

                                            return "No payment data";

                                        }

                                        return (
                                            `${context.label}: \u20B9${formatMoney(
                                                context.raw
                                            )}`
                                        );

                                    }

                            }

                        }

                    }

                }
            }
        );


    renderPaymentLegend(
        labels,
        values,
        colors
    );

}


function renderPaymentLegend(
    labels,
    values,
    colors
) {

    paymentMethodLegend.innerHTML = "";


    if (labels.length === 0) {

        paymentMethodLegend.innerHTML = `

            <div class="payment-legend-item">

                <span>
                    No payment records
                </span>

            </div>

        `;

        return;

    }


    labels.forEach(
        (
            label,
            index
        ) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "payment-legend-item";

            item.innerHTML = `

                <div class="payment-legend-info">

                    <span
                        class="payment-legend-color"
                        style="background:${colors[index % colors.length]}">
                    </span>

                    <span>
                        ${escapeHTML(label)}
                    </span>

                </div>

                <strong>
                    \u20B9${formatMoney(values[index])}
                </strong>

            `;

            paymentMethodLegend.appendChild(
                item
            );

        }
    );

}


/* =========================================
   ORDER STATUS CHART
========================================= */

function renderOrderStatusChart() {

    const statuses = [
        "Pending",
        "Ready",
        "Paid",
        "Completed"
    ];


    const values =
        statuses.map(status => {

            return filteredOrders.filter(
                order =>
                    order.status === status
            ).length;

        });


    if (orderStatusChartInstance) {

        orderStatusChartInstance.destroy();

    }


    orderStatusChartInstance =
        new Chart(
            orderStatusChartCanvas,
            {
                type: "bar",

                data: {

                    labels: statuses,

                    datasets: [
                        {
                            label: "Orders",

                            data: values,

                            backgroundColor: [
                                "#d99b32",
                                "#4f91ce",
                                "#45ad73",
                                "#9364c7"
                            ],

                            borderRadius: 7,

                            borderSkipped: false
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            }
                        },

                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }

                    }

                }
            }
        );

}


/* =========================================
   ORDER TYPE CHART
========================================= */

function renderOrderTypeChart() {

    const typeMap = {};


    filteredBills.forEach(bill => {

        const orderType =
            bill.orderType ||
            "Other";

        typeMap[orderType] =
            (typeMap[orderType] || 0) +
            bill.total;

    });


    const labels =
        Object.keys(typeMap);

    const values =
        Object.values(typeMap);


    if (orderTypeChartInstance) {

        orderTypeChartInstance.destroy();

    }


    orderTypeChartInstance =
        new Chart(
            orderTypeChartCanvas,
            {
                type: "polarArea",

                data: {

                    labels:
                        labels.length > 0
                            ? labels
                            : ["No Data"],

                    datasets: [
                        {
                            data:
                                values.length > 0
                                    ? values
                                    : [1],

                            backgroundColor: [
                                "rgba(212, 175, 55, 0.75)",
                                "rgba(69, 173, 115, 0.75)",
                                "rgba(79, 145, 206, 0.75)",
                                "rgba(147, 100, 199, 0.75)"
                            ],

                            borderColor:
                                "#111111",

                            borderWidth: 2
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {
                                boxWidth: 10,
                                padding: 12
                            }

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        if (
                                            labels.length ===
                                            0
                                        ) {

                                            return "No order data";

                                        }

                                        return (
                                            `${context.label}: \u20B9${formatMoney(
                                                context.raw
                                            )}`
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        r: {

                            ticks: {
                                display: false
                            },

                            grid: {
                                color:
                                    "rgba(255,255,255,0.08)"
                            }

                        }

                    }

                }
            }
        );

}


/* =========================================
   TOP ITEMS CHART
========================================= */

function renderTopItemsChart() {

    const itemData =
        getPopularItems()
            .slice(0, 5);


    const labels =
        itemData.map(
            item => item.name
        );

    const values =
        itemData.map(
            item => item.quantity
        );


    if (topItemsChartInstance) {

        topItemsChartInstance.destroy();

    }


    topItemsChartInstance =
        new Chart(
            topItemsChartCanvas,
            {
                type: "bar",

                data: {

                    labels:
                        labels.length > 0
                            ? labels
                            : ["No Data"],

                    datasets: [
                        {
                            label:
                                "Quantity Sold",

                            data:
                                values.length > 0
                                    ? values
                                    : [0],

                            backgroundColor:
                                "rgba(212, 175, 55, 0.75)",

                            borderColor:
                                "#d4af37",

                            borderWidth: 1,

                            borderRadius: 6
                        }
                    ]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            }

                        },

                        y: {
                            grid: {
                                display: false
                            }
                        }

                    }

                }
            }
        );

}


/* =========================================
   POPULAR ITEMS
========================================= */

function getPopularItems() {

    const itemMap = {};


    filteredBills.forEach(bill => {

        bill.items.forEach(item => {

            const key =
                item.name
                    .trim()
                    .toLowerCase();


            if (!itemMap[key]) {

                itemMap[key] = {

                    name:
                        item.name,

                    quantity: 0,

                    revenue: 0

                };

            }


            itemMap[key].quantity +=
                item.quantity;


            itemMap[key].revenue +=
                item.price *
                item.quantity;

        });

    });


    return Object
        .values(itemMap)
        .sort(
            (a, b) =>
                b.quantity -
                a.quantity
        );

}


function renderPopularItems() {

    const popularItems =
        getPopularItems();


    popularItemsBody.innerHTML = "";


    popularItemsCount.textContent =
        `${popularItems.length} ${
            popularItems.length === 1
                ? "Item"
                : "Items"
        }`;


    if (popularItems.length === 0) {

        popularItemsEmpty.classList.add(
            "show"
        );

        return;

    }


    popularItemsEmpty.classList.remove(
        "show"
    );


    popularItems
        .slice(0, 10)
        .forEach(
            (
                item,
                index
            ) => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>

                        <span class="rank-badge">

                            ${index + 1}

                        </span>

                    </td>

                    <td>

                        <span class="analytics-item-name">

                            ${escapeHTML(item.name)}

                        </span>

                    </td>

                    <td>

                        ${item.quantity}

                    </td>

                    <td>

                        <span class="analytics-revenue">

                            \u20B9${formatMoney(item.revenue)}

                        </span>

                    </td>

                `;

                popularItemsBody.appendChild(
                    row
                );

            }
        );

}


/* =========================================
   STOCK ALERTS
========================================= */

function renderStockAlerts() {

    const alertItems =
        inventoryItems
            .filter(
                item =>
                    item.currentStock <=
                    item.minimumStock
            )
            .sort(
                (a, b) =>
                    a.currentStock -
                    b.currentStock
            );


    stockAlertsBody.innerHTML = "";


    if (alertItems.length === 0) {

        stockAlertsEmpty.classList.add(
            "show"
        );

        return;

    }


    stockAlertsEmpty.classList.remove(
        "show"
    );


    alertItems
        .slice(0, 10)
        .forEach(item => {

            const status =
                item.currentStock <= 0
                    ? "Out of Stock"
                    : "Low Stock";


            const statusClass =
                item.currentStock <= 0
                    ? "status-out-of-stock"
                    : "status-low-stock";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <span class="analytics-item-name">

                        ${escapeHTML(item.name)}

                    </span>

                </td>

                <td>

                    ${formatQuantity(item.currentStock)}
                    ${escapeHTML(item.unit)}

                </td>

                <td>

                    ${formatQuantity(item.minimumStock)}
                    ${escapeHTML(item.unit)}

                </td>

                <td>

                    <span class="stock-status ${statusClass}">

                        ${status}

                    </span>

                </td>

            `;


            stockAlertsBody.appendChild(
                row
            );

        });

}


/* =========================================
   TRANSACTIONS
========================================= */

function renderTransactions() {

    const searchValue =
        transactionSearch.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        transactionStatusFilter.value;


    const transactionBills =
        filteredBills.filter(bill => {

            const matchesSearch =

                bill.id
                    .toLowerCase()
                    .includes(searchValue)

                ||

                bill.orderId
                    .toLowerCase()
                    .includes(searchValue)

                ||

                bill.customer
                    .toLowerCase()
                    .includes(searchValue)

                ||

                bill.paymentMethod
                    .toLowerCase()
                    .includes(searchValue);


            const matchesStatus =

                selectedStatus === "All"

                ||

                bill.paymentStatus ===
                selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    transactionsBody.innerHTML = "";


    if (transactionBills.length === 0) {

        transactionsEmptyState.classList.add(
            "show"
        );

        return;

    }


    transactionsEmptyState.classList.remove(
        "show"
    );


    transactionBills
        .sort(
            (a, b) =>
                new Date(
                    b.createdAt
                ) -
                new Date(
                    a.createdAt
                )
        )
        .forEach(bill => {

            const totalItems =
                bill.items.reduce(
                    (total, item) =>
                        total +
                        item.quantity,
                    0
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(bill.id)}
                </td>

                <td>
                    ${escapeHTML(bill.orderId)}
                </td>

                <td>
                    ${escapeHTML(bill.customer)}
                </td>

                <td>
                    ${escapeHTML(bill.orderType)}
                </td>

                <td>
                    ${escapeHTML(bill.paymentMethod)}
                </td>

                <td>

                    <span class="transaction-status ${getPaymentStatusClass(
                        bill.paymentStatus
                    )}">

                        ${escapeHTML(
                            bill.paymentStatus
                        )}

                    </span>

                </td>

                <td>
                    ${totalItems}
                </td>

                <td>

                    <span class="transaction-total">

                        \u20B9${formatMoney(bill.total)}

                    </span>

                </td>

                <td>
                    ${formatDateTime(
                        bill.createdAt
                    )}
                </td>

            `;


            transactionsBody.appendChild(
                row
            );

        });

}


/* =========================================
   BUSINESS INSIGHTS
========================================= */

function updateBusinessInsights() {

    const paidBills =
        filteredBills.filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        );


    const revenue =
        paidBills.reduce(
            (total, bill) =>
                total + bill.total,
            0
        );


    if (paidBills.length > 0) {

        const average =
            revenue /
            paidBills.length;

        revenueInsight.textContent =
            `The selected period generated \u20B9${formatMoney(
                revenue
            )} from ${paidBills.length} paid bills, with an average bill value of \u20B9${formatMoney(
                average
            )}.`;

    } else {

        revenueInsight.textContent =
            "No paid billing transactions were found for the selected period.";

    }


    const popularItems =
        getPopularItems();


    if (popularItems.length > 0) {

        const topItem =
            popularItems[0];

        productInsight.textContent =
            `${topItem.name} is the best-selling item with ${topItem.quantity} units sold and \u20B9${formatMoney(
                topItem.revenue
            )} in revenue.`;

    } else {

        productInsight.textContent =
            "No product sales information is available for the selected period.";

    }


    const paymentMap = {};


    paidBills.forEach(bill => {

        paymentMap[bill.paymentMethod] =
            (
                paymentMap[
                    bill.paymentMethod
                ] || 0
            ) + bill.total;

    });


    const topPaymentMethod =
        Object.entries(paymentMap)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    if (topPaymentMethod) {

        paymentInsight.textContent =
            `${topPaymentMethod[0]} is the leading payment method, accounting for \u20B9${formatMoney(
                topPaymentMethod[1]
            )} in completed payments.`;

    } else {

        paymentInsight.textContent =
            "No completed payment information is available for the selected period.";

    }


    const stockAlerts =
        inventoryItems.filter(
            item =>
                item.currentStock <=
                item.minimumStock
        );


    const outOfStock =
        stockAlerts.filter(
            item =>
                item.currentStock <= 0
        );


    if (stockAlerts.length === 0) {

        inventoryInsight.textContent =
            "All tracked inventory items are currently above their minimum stock levels.";

    } else {

        inventoryInsight.textContent =
            `${stockAlerts.length} inventory items require attention, including ${outOfStock.length} out-of-stock items.`;

    }

}


/* =========================================
   PERIOD BUTTON EVENTS
========================================= */

periodButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            periodButtons.forEach(
                periodButton => {

                    periodButton.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            selectedPeriod =
                button.dataset.period;


            customStartDate = null;

            customEndDate = null;


            updateDashboard();

        }
    );

});


/* =========================================
   CUSTOM DATE FILTER
========================================= */

applyCustomDateBtn.addEventListener(
    "click",
    function () {

        if (
            !startDateInput.value ||
            !endDateInput.value
        ) {

            showToast(
                "Select both start and end dates.",
                "error"
            );

            return;

        }


        const start =
            new Date(
                `${startDateInput.value}T00:00:00`
            );


        const end =
            new Date(
                `${endDateInput.value}T23:59:59.999`
            );


        if (start > end) {

            showToast(
                "The start date cannot be after the end date.",
                "error"
            );

            return;

        }


        periodButtons.forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


        selectedPeriod = "custom";

        customStartDate = start;

        customEndDate = end;


        updateDashboard();


        showToast(
            "Custom report period applied.",
            "success"
        );

    }
);


/* =========================================
   REFRESH REPORTS
========================================= */

refreshReportsBtn.addEventListener(
    "click",
    function () {
        refreshReportsFromApi(true);

    }
);


/* =========================================
   TRANSACTION FILTER EVENTS
========================================= */

transactionSearch.addEventListener(
    "input",
    renderTransactions
);


transactionStatusFilter.addEventListener(
    "change",
    renderTransactions
);


/* =========================================
   EXPORT MODAL
========================================= */

exportReportBtn.addEventListener(
    "click",
    function () {

        updateExportSummary();

        openModal(
            exportReportModal
        );

    }
);


closeExportModalBtn.addEventListener(
    "click",
    function () {

        closeModal(
            exportReportModal
        );

    }
);


cancelExportModalBtn.addEventListener(
    "click",
    function () {

        closeModal(
            exportReportModal
        );

    }
);


confirmExportBtn.addEventListener(
    "click",
    function () {

        const selectedFormat =
            document.querySelector(
                'input[name="exportFormat"]:checked'
            )?.value;


        if (selectedFormat === "print") {

            closeModal(
                exportReportModal
            );

            window.print();

            return;

        }


        exportReportToCSV();

        closeModal(
            exportReportModal
        );

    }
);


/* =========================================
   EXPORT SUMMARY
========================================= */

function updateExportSummary() {

    const revenue =
        filteredBills
            .filter(
                bill =>
                    bill.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (total, bill) =>
                    total + bill.total,
                0
            );


    exportPeriodText.textContent =
        getSelectedPeriodLabel();

    exportTransactionCount.textContent =
        filteredBills.length;

    exportRevenueTotal.textContent =
        formatMoney(revenue);

}


/* =========================================
   EXPORT CSV
========================================= */

function exportReportToCSV() {

    if (filteredBills.length === 0) {

        showToast(
            "No report data is available to export.",
            "error"
        );

        return;

    }


    const headers = [

        "Bill ID",
        "Order ID",
        "Customer",
        "Table",
        "Order Type",
        "Items",
        "Subtotal",
        "Discount",
        "GST",
        "Service Charge",
        "Grand Total",
        "Payment Method",
        "Payment Status",
        "Date and Time"

    ];


    const rows =
        filteredBills.map(bill => {

            const itemDescription =
                bill.items
                    .map(item => {

                        return (
                            `${item.name} x${item.quantity}`
                        );

                    })
                    .join(" | ");


            return [

                bill.id,

                bill.orderId,

                bill.customer,

                bill.table,

                bill.orderType,

                itemDescription,

                bill.subtotal,

                bill.discount,

                bill.gst,

                bill.serviceCharge,

                bill.total,

                bill.paymentMethod,

                bill.paymentStatus,

                formatDateTime(
                    bill.createdAt
                )

            ];

        });


    const csvContent = [

        headers.join(","),

        ...rows.map(row => {

            return row
                .map(value => {

                    return (
                        `"${String(value)
                            .replaceAll(
                                '"',
                                '""'
                            )}"`
                    );

                })
                .join(",");

        })

    ].join("\n");


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `alleppey-pub-report-${Date.now()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(url);


    showToast(
        "Report exported successfully.",
        "success"
    );

}


/* =========================================
   MODAL HELPERS
========================================= */

function openModal(modal) {

    modal.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";

}


function closeModal(modal) {

    modal.classList.remove(
        "active"
    );

    const activeModal =
        document.querySelector(
            ".modal-overlay.active"
        );


    if (!activeModal) {

        document.body.style.overflow =
            "";

    }

}


exportReportModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            exportReportModal
        ) {

            closeModal(
                exportReportModal
            );

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeModal(
                exportReportModal
            );

        }

    }
);


/* =========================================
   HELPER FUNCTIONS
========================================= */

function formatMoney(value) {

    return Number(value || 0)
        .toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


function formatQuantity(value) {

    const number =
        Number(value || 0);


    if (Number.isInteger(number)) {

        return number.toString();

    }


    return number.toFixed(2);

}


function formatDateTime(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "\u2014";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function getPaymentStatusClass(status) {

    const statusClasses = {

        Paid:
            "status-paid",

        Pending:
            "status-pending",

        "Partially Paid":
            "status-partially-paid",

        Refunded:
            "status-refunded"

    };


    return (
        statusClasses[status] ||
        "status-pending"
    );

}


function getSelectedPeriodLabel() {

    const labels = {

        today:
            "Today",

        week:
            "This Week",

        month:
            "This Month",

        year:
            "This Year",

        all:
            "All Time",

        custom:
            `${startDateInput.value} to ${endDateInput.value}`

    };


    return (
        labels[selectedPeriod] ||
        "Selected Period"
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


/* =========================================
   TOAST
========================================= */

function showToast(
    message,
    type = ""
) {

    toast.textContent = message;


    toast.classList.remove(
        "show",
        "success",
        "error"
    );


    if (type) {

        toast.classList.add(type);

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2600);

}


/* =========================================
   INITIAL DATE VALUES
========================================= */

function setInitialDates() {

    const today =
        new Date();


    const thirtyDaysAgo =
        new Date(today);


    thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30
    );


    startDateInput.value =
        formatDateForInput(
            thirtyDaysAgo
        );


    endDateInput.value =
        formatDateForInput(
            today
        );

}


function formatDateForInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializeReportsPage() {

    if (!checkAdminAccess()) {
        return;
    }

    configureChartDefaults();

    setInitialDates();

    loadReportsData();

    updateDashboard();

    showReportDataStatus(true);

    await refreshReportsFromApi(false);

    window.setInterval(
        function () {
            if (!document.hidden) {
                refreshReportsFromApi(false);
            }
        },
        REPORT_REFRESH_INTERVAL
    );

}


backDashboardBtn.addEventListener(
    "click",
    function () {
        window.location.href = "admin-dashboard.html";
    }
);


window.addEventListener(
    "storage",
    function (event) {
        if (
            [
                ORDER_STORAGE_KEY,
                BILL_STORAGE_KEY,
                INVENTORY_STORAGE_KEY
            ].includes(event.key)
        ) {
            loadReportsData();
            updateDashboard();
        }
    }
);


initializeReportsPage();
