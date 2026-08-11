/* =========================================
   ALLEPPEY PUB ERP
   BILLING & POS
========================================= */

const ORDER_STORAGE_KEY = "pubOrders";
const BILL_STORAGE_KEY = "pubBills";
const LIVE_REFRESH_INTERVAL = 20000;

let orders = [];
let bills = [];
let selectedOrderId = null;
let selectedBillId = null;
let billItems = [];
let selectedOrderFilter = "All";
let toastTimer;


/* =========================================
   MAIN ELEMENTS
========================================= */

const orderList =
    document.getElementById("orderList");

const orderEmptyState =
    document.getElementById("orderEmptyState");

const orderSearch =
    document.getElementById("orderSearch");

const orderFilterButtons =
    document.querySelectorAll(".order-filter-btn");

const availableOrderCount =
    document.getElementById("availableOrderCount");

const orderDataStatus =
    document.getElementById("orderDataStatus");

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");

const backDashboardBtn =
    document.getElementById("backDashboardBtn");


/* =========================================
   CURRENT BILL ELEMENTS
========================================= */

const selectedOrderTitle =
    document.getElementById("selectedOrderTitle");

const billStatus =
    document.getElementById("billStatus");

const billCustomerName =
    document.getElementById("billCustomerName");

const billTableNumber =
    document.getElementById("billTableNumber");

const billOrderTime =
    document.getElementById("billOrderTime");

const billOrderType =
    document.getElementById("billOrderType");

const billItemCount =
    document.getElementById("billItemCount");

const billItemsBody =
    document.getElementById("billItemsBody");

const billEmptyState =
    document.getElementById("billEmptyState");


/* =========================================
   CALCULATION ELEMENTS
========================================= */

const billSubtotal =
    document.getElementById("billSubtotal");

const discountInput =
    document.getElementById("discountInput");

const discountType =
    document.getElementById("discountType");

const discountAmount =
    document.getElementById("discountAmount");

const gstInput =
    document.getElementById("gstInput");

const gstAmount =
    document.getElementById("gstAmount");

const serviceChargeInput =
    document.getElementById("serviceChargeInput");

const serviceChargeAmount =
    document.getElementById("serviceChargeAmount");

const grandTotal =
    document.getElementById("grandTotal");

const paymentStatusSelect =
    document.getElementById("paymentStatusSelect");

const paymentNotes =
    document.getElementById("paymentNotes");


/* =========================================
   ACTION BUTTONS
========================================= */

const newBillBtn =
    document.getElementById("newBillBtn");

const openCustomItemModalBtn =
    document.getElementById("openCustomItemModal");

const clearBillBtn =
    document.getElementById("clearBillBtn");

const saveBillBtn =
    document.getElementById("saveBillBtn");

const markPaidBtn =
    document.getElementById("markPaidBtn");

const printReceiptBtn =
    document.getElementById("printReceiptBtn");

const exportBillsBtn =
    document.getElementById("exportBillsBtn");


/* =========================================
   STATISTICS
========================================= */

const todayBillsCount =
    document.getElementById("todayBillsCount");

const todayRevenue =
    document.getElementById("todayRevenue");

const pendingPaymentCount =
    document.getElementById("pendingPaymentCount");

const completedPaymentCount =
    document.getElementById("completedPaymentCount");


/* =========================================
   BILLING HISTORY
========================================= */

const billingHistoryBody =
    document.getElementById("billingHistoryBody");

const historyEmptyState =
    document.getElementById("historyEmptyState");

const billHistorySearch =
    document.getElementById("billHistorySearch");


/* =========================================
   CUSTOM ITEM MODAL
========================================= */

const customItemModal =
    document.getElementById("customItemModal");

const customItemForm =
    document.getElementById("customItemForm");

const customItemName =
    document.getElementById("customItemName");

const customItemPrice =
    document.getElementById("customItemPrice");

const customItemQuantity =
    document.getElementById("customItemQuantity");

const customItemNotes =
    document.getElementById("customItemNotes");

const closeCustomItemModalBtn =
    document.getElementById("closeCustomItemModal");

const cancelCustomItemModalBtn =
    document.getElementById("cancelCustomItemModal");


/* =========================================
   NEW BILL MODAL
========================================= */

const newBillModal =
    document.getElementById("newBillModal");

const newBillForm =
    document.getElementById("newBillForm");

const newBillCustomer =
    document.getElementById("newBillCustomer");

const newBillTable =
    document.getElementById("newBillTable");

const newBillOrderType =
    document.getElementById("newBillOrderType");

const newBillOrderId =
    document.getElementById("newBillOrderId");

const closeNewBillModalBtn =
    document.getElementById("closeNewBillModal");

const cancelNewBillModalBtn =
    document.getElementById("cancelNewBillModal");


/* =========================================
   RECEIPT MODAL
========================================= */

const receiptModal =
    document.getElementById("receiptModal");

const closeReceiptModalBtn =
    document.getElementById("closeReceiptModal");

const confirmPrintReceiptBtn =
    document.getElementById("confirmPrintReceipt");

const receiptBillId =
    document.getElementById("receiptBillId");

const receiptOrderId =
    document.getElementById("receiptOrderId");

const receiptCustomer =
    document.getElementById("receiptCustomer");

const receiptTable =
    document.getElementById("receiptTable");

const receiptDate =
    document.getElementById("receiptDate");

const receiptPaymentMethod =
    document.getElementById("receiptPaymentMethod");

const receiptItemsBody =
    document.getElementById("receiptItemsBody");

const receiptSubtotal =
    document.getElementById("receiptSubtotal");

const receiptDiscount =
    document.getElementById("receiptDiscount");

const receiptGst =
    document.getElementById("receiptGst");

const receiptServiceCharge =
    document.getElementById("receiptServiceCharge");

const receiptGrandTotal =
    document.getElementById("receiptGrandTotal");


/* =========================================
   DELETE BILL MODAL
========================================= */

const deleteBillModal =
    document.getElementById("deleteBillModal");

const deleteBillName =
    document.getElementById("deleteBillName");

const cancelDeleteBillBtn =
    document.getElementById("cancelDeleteBill");

const confirmDeleteBillBtn =
    document.getElementById("confirmDeleteBill");


/* =========================================
   TOAST
========================================= */

const toast =
    document.getElementById("toast");


/* =========================================
   DEFAULT ORDERS
========================================= */

const defaultOrders = [

    {
        id: "ORD-1001",
        customer: "Aneesh",
        table: "T-01",
        orderType: "Dine In",
        status: "Ready",
        time: new Date().toISOString(),
        items: [
            {
                id: 1,
                name: "Lager Beer",
                price: 220,
                quantity: 2,
                notes: ""
            },
            {
                id: 2,
                name: "Pub Burger",
                price: 420,
                quantity: 1,
                notes: "Extra cheese"
            }
        ]
    },

    {
        id: "ORD-1002",
        customer: "Walk-in Customer",
        table: "T-04",
        orderType: "Dine In",
        status: "Pending",
        time: new Date().toISOString(),
        items: [
            {
                id: 3,
                name: "Mojito",
                price: 350,
                quantity: 2,
                notes: ""
            },
            {
                id: 4,
                name: "Chicken Wings",
                price: 390,
                quantity: 1,
                notes: "Spicy"
            }
        ]
    },

    {
        id: "ORD-1003",
        customer: "Rahul",
        table: "Takeaway",
        orderType: "Takeaway",
        status: "Ready",
        time: new Date().toISOString(),
        items: [
            {
                id: 5,
                name: "Pub Burger",
                price: 420,
                quantity: 2,
                notes: ""
            }
        ]
    }

];


/* =========================================
   ACCESS AND LIVE API
========================================= */

function checkBillingAccess() {

    const role = localStorage.getItem("userRole");

    const employeeLoggedIn =
        localStorage.getItem("employeeLoggedIn") === "true" ||
        sessionStorage.getItem("employeeLoggedIn") === "true";

    const adminLoggedIn =
        localStorage.getItem("adminLoggedIn") === "true" ||
        sessionStorage.getItem("adminLoggedIn") === "true";

    const allowed =
        (role === "employee" && employeeLoggedIn) ||
        (role === "admin" && adminLoggedIn);

    if (!allowed) {
        window.location.replace("role-selection.html");
    }

    return allowed;

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
            console.error("The server response could not be read.", error);
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


async function refreshLiveOrders(showMessage = true) {

    if (refreshOrdersBtn.disabled) {
        return false;
    }

    refreshOrdersBtn.disabled = true;
    refreshOrdersBtn.querySelector("i")
        ?.classList.add("fa-spin");

    try {

        const [orderResult, billResult] =
            await Promise.all([
                apiRequest("/orders"),
                apiRequest("/bills")
            ]);

        const manualOrders =
            orders.filter(order => order.manual);

        const liveOrders = Array.isArray(orderResult)
            ? orderResult.map(normalizeOrder)
            : [];

        orders = [...manualOrders, ...liveOrders];

        bills = Array.isArray(billResult)
            ? billResult.map(normalizeBill)
            : [];

        saveOrders();
        saveBills();

        if (
            selectedOrderId &&
            !orders.some(order => order.id === selectedOrderId)
        ) {
            resetBillView();
        }

        renderOrders();
        updateOrderDataStatus(false);

        if (showMessage) {
            showToast("Orders refreshed from the database.", "success");
        }

        return true;

    } catch (error) {

        console.error("Unable to load live orders.", error);
        updateOrderDataStatus(true);

        if (showMessage) {
            showToast("Server unavailable. Showing saved orders.", "error");
        }

        return false;

    } finally {

        refreshOrdersBtn.disabled = false;
        refreshOrdersBtn.querySelector("i")
            ?.classList.remove("fa-spin");

    }

}


async function saveBillToDatabase(bill) {

    try {
        const savedBill = await apiRequest(
            "/bills",
            {
                method: "POST",
                body: JSON.stringify(bill)
            }
        );

        return normalizeBill(savedBill);
    } catch (error) {
        console.error("Unable to save the bill.", error);
        showToast(
            error.message || "The bill could not be saved to the database.",
            "error"
        );
        return null;
    }

}


function updateOrderDataStatus(usingCache) {

    if (usingCache) {
        orderDataStatus.textContent = "Saved orders - backend unavailable";
        orderDataStatus.classList.add("offline");
        return;
    }

    const time = new Date().toLocaleTimeString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit" }
    );

    orderDataStatus.textContent = `Live - updated ${time}`;
    orderDataStatus.classList.remove("offline");

}


/* =========================================
   LOAD DATA
========================================= */

function loadData() {

    try {

        const savedOrders =
            JSON.parse(
                localStorage.getItem(
                    ORDER_STORAGE_KEY
                )
            );

        const savedBills =
            JSON.parse(
                localStorage.getItem(
                    BILL_STORAGE_KEY
                )
            );

        orders =
            Array.isArray(savedOrders)
                ? savedOrders.map(normalizeOrder)
                : [];

        bills =
            Array.isArray(savedBills)
                ? savedBills.map(normalizeBill)
                : [];

    } catch (error) {

        console.error(
            "Unable to load billing data:",
            error
        );

        orders = [];

        bills = [];

        saveBills();

    }

}


/* =========================================
   NORMALIZE ORDER
========================================= */

function normalizeOrder(order) {

    return {

        id:
            String(
                order.id ||
                generateOrderId()
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

        manual:
            Boolean(order.manual),

        items:
            Array.isArray(order.items)
                ? order.items.map(
                    normalizeBillItem
                )
                : []

    };

}


/* =========================================
   NORMALIZE BILL ITEM
========================================= */

function normalizeBillItem(item) {

    return {

        id:
            item.id ||
            Date.now() +
            Math.floor(Math.random() * 1000),

        name:
            String(
                item.name ||
                "Billing Item"
            ),

        price:
            Number(item.price) || 0,

        quantity:
            Number(item.quantity ?? item.qty) || 1,

        notes:
            String(item.notes || "")

    };

}


/* =========================================
   NORMALIZE BILL
========================================= */

function normalizeBill(bill) {

    return {

        id:
            String(
                bill.id ||
                generateBillId()
            ),

        orderId:
            String(
                bill.orderId ||
                "Manual"
            ),

        customer:
            String(
                bill.customer ||
                "Walk-in Customer"
            ),

        table:
            String(
                bill.table ||
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
                    normalizeBillItem
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
                "Pending"
            ),

        notes:
            String(bill.notes || ""),

        createdAt:
            bill.createdAt ||
            new Date().toISOString()

    };

}


/* =========================================
   SAVE DATA
========================================= */

function saveOrders() {

    localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(orders)
    );

}


function saveBills() {

    localStorage.setItem(
        BILL_STORAGE_KEY,
        JSON.stringify(bills)
    );

}


/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders() {

    const searchValue =
        orderSearch.value
            .trim()
            .toLowerCase();

    const filteredOrders =
        orders.filter(order => {

            const orderStatus =
                String(order.status)
                    .trim()
                    .toLowerCase();

            const isAvailable =
                !["completed", "cancelled", "paid"]
                    .includes(orderStatus);

            const matchesSearch =

                order.id
                    .toLowerCase()
                    .includes(searchValue)

                ||

                order.customer
                    .toLowerCase()
                    .includes(searchValue)

                ||

                order.table
                    .toLowerCase()
                    .includes(searchValue);


            const matchesStatus =

                selectedOrderFilter === "All"

                ||

                orderStatus ===
                selectedOrderFilter.toLowerCase();


            return (
                isAvailable &&
                matchesSearch &&
                matchesStatus
            );

        });


    orderList.innerHTML = "";

    availableOrderCount.textContent =
        `${filteredOrders.length} ${
            filteredOrders.length === 1
                ? "Order"
                : "Orders"
        }`;


    if (filteredOrders.length === 0) {

        orderEmptyState.classList.add("show");

        return;

    }

    orderEmptyState.classList.remove("show");


    filteredOrders.forEach(order => {

        const orderTotal =
            calculateOrderTotal(order.items);

        const card =
            document.createElement("article");

        card.className =
            "order-card";

        if (
            selectedOrderId ===
            order.id
        ) {

            card.classList.add("active");

        }

        card.innerHTML = `

            <div class="order-card-top">

                <strong>
                    ${escapeHTML(order.id)}
                </strong>

                <span class="order-card-status ${getOrderStatusClass(order.status)}">

                    ${escapeHTML(order.status)}

                </span>

            </div>


            <div class="order-card-info">

                <span>

                    <i class="fa-solid fa-user"></i>

                    ${escapeHTML(order.customer)}

                </span>

                <span>

                    <i class="fa-solid fa-chair"></i>

                    ${escapeHTML(order.table)}

                </span>

                <span>

                    <i class="fa-solid fa-bag-shopping"></i>

                    ${escapeHTML(order.orderType)}

                </span>

                <span>

                    <i class="fa-solid fa-clock"></i>

                    ${formatTime(order.time)}

                </span>

            </div>


            <div class="order-card-bottom">

                <span>
                    ${order.items.length} Items
                </span>

                <strong>
                    \u20B9${formatMoney(orderTotal)}
                </strong>

            </div>

        `;

        card.addEventListener(
            "click",
            function () {

                selectOrder(order.id);

            }
        );

        orderList.appendChild(card);

    });

}


/* =========================================
   SELECT ORDER
========================================= */

function selectOrder(orderId) {

    const order =
        orders.find(
            orderItem =>
                orderItem.id === orderId
        );

    if (!order) {

        showToast(
            "Order not found.",
            "error"
        );

        return;

    }

    selectedOrderId = order.id;

    billItems =
        order.items.map(
            item => ({ ...item })
        );

    selectedOrderTitle.textContent =
        order.id;

    billCustomerName.textContent =
        order.customer;

    billTableNumber.textContent =
        order.table;

    billOrderTime.textContent =
        formatDateTime(order.time);

    billOrderType.textContent =
        order.orderType;

    paymentStatusSelect.value =
        order.status === "Paid"
            ? "Paid"
            : "Pending";

    paymentNotes.value = "";

    resetBillCalculations();

    updateBillStatus(
        paymentStatusSelect.value
    );

    renderBillItems();

    renderOrders();

}


/* =========================================
   RENDER BILL ITEMS
========================================= */

function renderBillItems() {

    billItemsBody.innerHTML = "";

    if (
        !selectedOrderId ||
        billItems.length === 0
    ) {

        billEmptyState.classList.add("show");

        billItemCount.textContent =
            "0 Items";

        calculateBill();

        return;

    }

    billEmptyState.classList.remove("show");


    billItems.forEach(item => {

        const row =
            document.createElement("tr");

        const itemTotal =
            item.price *
            item.quantity;

        row.innerHTML = `

            <td>

                <div class="bill-item-name">

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <small>
                        ${escapeHTML(item.notes || "No notes")}
                    </small>

                </div>

            </td>


            <td>
                \u20B9${formatMoney(item.price)}
            </td>


            <td>

                <div class="quantity-control">

                    <button
                        type="button"
                        onclick="changeItemQuantity('${item.id}', -1)">

                        <i class="fa-solid fa-minus"></i>

                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        onclick="changeItemQuantity('${item.id}', 1)">

                        <i class="fa-solid fa-plus"></i>

                    </button>

                </div>

            </td>


            <td>
                \u20B9${formatMoney(itemTotal)}
            </td>


            <td>

                <button
                    type="button"
                    class="remove-bill-item-btn"
                    onclick="removeBillItem('${item.id}')">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;

        billItemsBody.appendChild(row);

    });


    billItemCount.textContent =
        `${billItems.length} ${
            billItems.length === 1
                ? "Item"
                : "Items"
        }`;

    calculateBill();

}


/* =========================================
   CHANGE ITEM QUANTITY
========================================= */

function changeItemQuantity(
    itemId,
    change
) {

    const item =
        billItems.find(
            billItem =>
                String(billItem.id) ===
                String(itemId)
        );

    if (!item) {

        return;

    }

    item.quantity += change;

    if (item.quantity <= 0) {

        removeBillItem(itemId);

        return;

    }

    renderBillItems();

}


/* =========================================
   REMOVE BILL ITEM
========================================= */

function removeBillItem(itemId) {

    billItems =
        billItems.filter(
            item =>
                String(item.id) !==
                String(itemId)
        );

    renderBillItems();

    showToast(
        "Item removed from bill.",
        "success"
    );

}


/* =========================================
   CALCULATE BILL
========================================= */

function calculateBill() {

    const subtotal =
        billItems.reduce(
            (total, item) => {

                return total +
                    item.price *
                    item.quantity;

            },
            0
        );


    const enteredDiscount =
        Math.max(
            0,
            Number(discountInput.value) || 0
        );


    let calculatedDiscount = 0;


    if (
        discountType.value ===
        "percentage"
    ) {

        const safePercentage =
            Math.min(
                enteredDiscount,
                100
            );

        calculatedDiscount =
            subtotal *
            safePercentage /
            100;

    } else {

        calculatedDiscount =
            Math.min(
                enteredDiscount,
                subtotal
            );

    }


    const taxableAmount =
        Math.max(
            0,
            subtotal -
            calculatedDiscount
        );


    const gstPercentage =
        Math.max(
            0,
            Number(gstInput.value) || 0
        );


    const servicePercentage =
        Math.max(
            0,
            Number(
                serviceChargeInput.value
            ) || 0
        );


    const calculatedGst =
        taxableAmount *
        gstPercentage /
        100;


    const calculatedServiceCharge =
        taxableAmount *
        servicePercentage /
        100;


    const total =
        taxableAmount +
        calculatedGst +
        calculatedServiceCharge;


    billSubtotal.textContent =
        formatMoney(subtotal);

    discountAmount.textContent =
        formatMoney(calculatedDiscount);

    gstAmount.textContent =
        formatMoney(calculatedGst);

    serviceChargeAmount.textContent =
        formatMoney(
            calculatedServiceCharge
        );

    grandTotal.textContent =
        formatMoney(total);


    return {

        subtotal,

        discount:
            calculatedDiscount,

        gst:
            calculatedGst,

        serviceCharge:
            calculatedServiceCharge,

        total

    };

}


/* =========================================
   RESET CALCULATIONS
========================================= */

function resetBillCalculations() {

    discountInput.value = 0;

    discountType.value =
        "percentage";

    gstInput.value = 5;

    serviceChargeInput.value = 0;

}


/* =========================================
   CALCULATION EVENTS
========================================= */

[
    discountInput,
    discountType,
    gstInput,
    serviceChargeInput

].forEach(element => {

    element.addEventListener(
        "input",
        calculateBill
    );

    element.addEventListener(
        "change",
        calculateBill
    );

});


/* =========================================
   CUSTOM ITEM MODAL
========================================= */

openCustomItemModalBtn.addEventListener(
    "click",
    function () {

        if (!selectedOrderId) {

            showToast(
                "Select or create a bill first.",
                "error"
            );

            return;

        }

        customItemForm.reset();

        customItemQuantity.value = 1;

        openModal(customItemModal);

        setTimeout(() => {

            customItemName.focus();

        }, 150);

    }
);


customItemForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const name =
            customItemName.value.trim();

        const price =
            Number(
                customItemPrice.value
            );

        const quantity =
            Number(
                customItemQuantity.value
            );

        const notes =
            customItemNotes.value.trim();


        if (!name) {

            showToast(
                "Enter an item name.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            showToast(
                "Enter a valid item price.",
                "error"
            );

            return;

        }


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            showToast(
                "Enter a valid quantity.",
                "error"
            );

            return;

        }


        billItems.push({

            id:
                Date.now(),

            name,

            price,

            quantity,

            notes

        });


        closeModal(customItemModal);

        renderBillItems();

        showToast(
            "Custom item added to bill.",
            "success"
        );

    }
);


/* =========================================
   NEW MANUAL BILL
========================================= */

newBillBtn.addEventListener(
    "click",
    function () {

        newBillForm.reset();

        newBillOrderType.value =
            "Dine In";

        newBillOrderId.value =
            generateOrderId();

        openModal(newBillModal);

        setTimeout(() => {

            newBillCustomer.focus();

        }, 150);

    }
);


newBillForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const order = {

            id:
                newBillOrderId.value,

            customer:
                newBillCustomer.value
                    .trim() ||
                "Walk-in Customer",

            table:
                newBillTable.value
                    .trim() ||
                "N/A",

            orderType:
                newBillOrderType.value,

            status:
                "Pending",

            time:
                new Date()
                    .toISOString(),

            manual:
                true,

            items: []

        };


        orders.unshift(order);

        saveOrders();

        closeModal(newBillModal);

        selectOrder(order.id);

        showToast(
            "New manual bill created.",
            "success"
        );

    }
);


/* =========================================
   CLEAR BILL
========================================= */

clearBillBtn.addEventListener(
    "click",
    function () {

        if (!selectedOrderId) {

            showToast(
                "No bill selected.",
                "error"
            );

            return;

        }

        billItems = [];

        renderBillItems();

        showToast(
            "Bill items cleared.",
            "success"
        );

    }
);


/* =========================================
   GET PAYMENT METHOD
========================================= */

function getSelectedPaymentMethod() {

    return document.querySelector(
        'input[name="paymentMethod"]:checked'
    )?.value || "Cash";

}


/* =========================================
   CREATE BILL OBJECT
========================================= */

function createBillObject(
    forcedStatus = null
) {

    const order =
        orders.find(
            item =>
                item.id ===
                selectedOrderId
        );

    if (!order) {

        return null;

    }

    const calculations =
        calculateBill();


    return {

        id:
            generateBillId(),

        orderId:
            order.id,

        customer:
            order.customer,

        table:
            order.table,

        orderType:
            order.orderType,

        items:
            billItems.map(
                item => ({ ...item })
            ),

        subtotal:
            calculations.subtotal,

        discount:
            calculations.discount,

        gst:
            calculations.gst,

        serviceCharge:
            calculations.serviceCharge,

        total:
            calculations.total,

        paymentMethod:
            getSelectedPaymentMethod(),

        paymentStatus:
            forcedStatus ||
            paymentStatusSelect.value,

        notes:
            paymentNotes.value.trim(),

        createdAt:
            new Date().toISOString()

    };

}


/* =========================================
   SAVE BILL
========================================= */

saveBillBtn.addEventListener(
    "click",
    async function () {

        await saveCurrentBill();

    }
);


async function saveCurrentBill(
    forcedStatus = null
) {

    if (!selectedOrderId) {

        showToast(
            "Select an order first.",
            "error"
        );

        return null;

    }


    if (billItems.length === 0) {

        showToast(
            "Add at least one item.",
            "error"
        );

        return null;

    }


    const bill =
        createBillObject(
            forcedStatus
        );


    if (!bill) {

        showToast(
            "Unable to create bill.",
            "error"
        );

        return null;

    }


    const existingBillIndex =
        bills.findIndex(
            item =>
                item.orderId ===
                selectedOrderId
        );


    if (existingBillIndex >= 0) {

        bill.id =
            bills[existingBillIndex].id;

        bill.createdAt =
            bills[existingBillIndex].createdAt;

    }


    const persistedBill =
        await saveBillToDatabase(bill);


    if (!persistedBill) {
        return null;
    }


    Object.assign(bill, persistedBill);


    if (existingBillIndex >= 0) {

        bills[existingBillIndex] =
            bill;

    } else {

        bills.unshift(bill);

    }


    const order =
        orders.find(
            item =>
                item.id ===
                selectedOrderId
        );


    if (order) {

        order.items =
            billItems.map(
                item => ({ ...item })
            );

        order.status =
            bill.paymentStatus === "Paid"
                ? "Completed"
                : order.status;

    }


    saveBills();
    saveOrders();

    paymentStatusSelect.value =
        bill.paymentStatus;

    updateBillStatus(
        bill.paymentStatus
    );

    renderOrders();
    renderBillingHistory();
    updateStatistics();


    showToast(
        "Bill saved successfully.",
        "success"
    );

    return bill;

}


/* =========================================
   MARK AS PAID
========================================= */

markPaidBtn.addEventListener(
    "click",
    async function () {

        paymentStatusSelect.value =
            "Paid";

        markPaidBtn.disabled = true;

        const bill =
            await saveCurrentBill("Paid");

        markPaidBtn.disabled = false;

        if (!bill) {

            return;

        }

        showToast(
            "Payment marked as paid.",
            "success"
        );

    }
);


/* =========================================
   PAYMENT STATUS EVENT
========================================= */

paymentStatusSelect.addEventListener(
    "change",
    function () {

        updateBillStatus(
            paymentStatusSelect.value
        );

    }
);


/* =========================================
   UPDATE BILL STATUS BADGE
========================================= */

function updateBillStatus(status) {

    billStatus.textContent = status;

    billStatus.className =
        "bill-status";

    billStatus.classList.add(
        getPaymentStatusClass(status)
    );

}


/* =========================================
   PRINT CURRENT RECEIPT
========================================= */

printReceiptBtn.addEventListener(
    "click",
    function () {

        if (!selectedOrderId) {

            showToast(
                "Select an order first.",
                "error"
            );

            return;

        }

        if (billItems.length === 0) {

            showToast(
                "The bill has no items.",
                "error"
            );

            return;

        }

        const bill =
            createBillObject();

        populateReceipt(bill);

        openModal(receiptModal);

    }
);


/* =========================================
   POPULATE RECEIPT
========================================= */

function populateReceipt(bill) {

    if (!bill) {

        return;

    }

    receiptBillId.textContent =
        bill.id;

    receiptOrderId.textContent =
        bill.orderId;

    receiptCustomer.textContent =
        bill.customer;

    receiptTable.textContent =
        bill.table;

    receiptDate.textContent =
        formatDateTime(
            bill.createdAt
        );

    receiptPaymentMethod.textContent =
        bill.paymentMethod;

    receiptItemsBody.innerHTML = "";


    bill.items.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${escapeHTML(item.name)}
            </td>

            <td>
                ${item.quantity}
            </td>

            <td>
                \u20B9${formatMoney(
                    item.price *
                    item.quantity
                )}
            </td>

        `;

        receiptItemsBody.appendChild(row);

    });


    receiptSubtotal.textContent =
        formatMoney(bill.subtotal);

    receiptDiscount.textContent =
        formatMoney(bill.discount);

    receiptGst.textContent =
        formatMoney(bill.gst);

    receiptServiceCharge.textContent =
        formatMoney(
            bill.serviceCharge
        );

    receiptGrandTotal.textContent =
        formatMoney(bill.total);

}


/* =========================================
   CONFIRM PRINT
========================================= */

confirmPrintReceiptBtn.addEventListener(
    "click",
    function () {

        window.print();

    }
);


/* =========================================
   RENDER BILLING HISTORY
========================================= */

function renderBillingHistory() {

    const searchValue =
        billHistorySearch.value
            .trim()
            .toLowerCase();


    const filteredBills =
        bills.filter(bill => {

            return (

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

                bill.table
                    .toLowerCase()
                    .includes(searchValue)

                ||

                bill.paymentMethod
                    .toLowerCase()
                    .includes(searchValue)

            );

        });


    billingHistoryBody.innerHTML = "";


    if (filteredBills.length === 0) {

        historyEmptyState.classList.add(
            "show"
        );

        return;

    }

    historyEmptyState.classList.remove(
        "show"
    );


    filteredBills.forEach(bill => {

        const row =
            document.createElement("tr");

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
                ${escapeHTML(bill.table)}
            </td>

            <td>
                \u20B9${formatMoney(bill.total)}
            </td>

            <td>
                ${escapeHTML(
                    bill.paymentMethod
                )}
            </td>

            <td>

                <span class="history-status ${getPaymentStatusClass(bill.paymentStatus)}">

                    ${escapeHTML(
                        bill.paymentStatus
                    )}

                </span>

            </td>

            <td>
                ${formatDateTime(
                    bill.createdAt
                )}
            </td>

            <td>

                <div class="history-action-buttons">

                    <button
                        type="button"
                        class="history-action-btn view-bill-btn"
                        title="View bill"
                        onclick="viewSavedBill('${bill.id}')">

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    <button
                        type="button"
                        class="history-action-btn print-history-btn"
                        title="Print bill"
                        onclick="printSavedBill('${bill.id}')">

                        <i class="fa-solid fa-print"></i>

                    </button>


                    <button
                        type="button"
                        class="history-action-btn delete-history-btn"
                        title="Delete bill"
                        onclick="openDeleteBillModal('${bill.id}')">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;

        billingHistoryBody.appendChild(row);

    });

}


/* =========================================
   VIEW SAVED BILL
========================================= */

function viewSavedBill(billId) {

    const bill =
        bills.find(
            item =>
                item.id === billId
        );

    if (!bill) {

        showToast(
            "Bill not found.",
            "error"
        );

        return;

    }

    populateReceipt(bill);

    openModal(receiptModal);

}


/* =========================================
   PRINT SAVED BILL
========================================= */

function printSavedBill(billId) {

    const bill =
        bills.find(
            item =>
                item.id === billId
        );

    if (!bill) {

        showToast(
            "Bill not found.",
            "error"
        );

        return;

    }

    populateReceipt(bill);

    openModal(receiptModal);

}


/* =========================================
   DELETE BILL
========================================= */

function openDeleteBillModal(billId) {

    const bill =
        bills.find(
            item =>
                item.id === billId
        );

    if (!bill) {

        showToast(
            "Bill not found.",
            "error"
        );

        return;

    }

    selectedBillId = bill.id;

    deleteBillName.textContent =
        bill.id;

    openModal(deleteBillModal);

}


confirmDeleteBillBtn.addEventListener(
    "click",
    async function () {

        if (!selectedBillId) {

            return;

        }

        try {
            await apiRequest(
                `/bills/${encodeURIComponent(selectedBillId)}`,
                { method: "DELETE" }
            );
        } catch (error) {
            console.error("Unable to delete the bill.", error);
            showToast(
                error.message || "The billing record could not be deleted.",
                "error"
            );
            return;
        }

        bills = bills.filter(
            bill => bill.id !== selectedBillId
        );

        saveBills();

        closeModal(deleteBillModal);

        selectedBillId = null;

        renderBillingHistory();
        updateStatistics();

        showToast(
            "Billing record deleted.",
            "success"
        );

    }
);


/* =========================================
   HISTORY SEARCH
========================================= */

billHistorySearch.addEventListener(
    "input",
    renderBillingHistory
);


/* =========================================
   UPDATE STATISTICS
========================================= */

function updateStatistics() {

    const today =
        new Date()
            .toDateString();


    const todayBills =
        bills.filter(bill => {

            return (
                new Date(
                    bill.createdAt
                ).toDateString() ===
                today
            );

        });


    const revenue =
        todayBills
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


    const pendingCount =
        bills.filter(
            bill =>
                bill.paymentStatus ===
                "Pending" ||
                bill.paymentStatus ===
                "Partially Paid"
        ).length;


    const paidCount =
        bills.filter(
            bill =>
                bill.paymentStatus ===
                "Paid"
        ).length;


    todayBillsCount.textContent =
        todayBills.length;

    todayRevenue.textContent =
        formatMoney(revenue);

    pendingPaymentCount.textContent =
        pendingCount;

    completedPaymentCount.textContent =
        paidCount;

}


/* =========================================
   EXPORT BILLS
========================================= */

exportBillsBtn.addEventListener(
    "click",
    function () {

        if (bills.length === 0) {

            showToast(
                "No bills available to export.",
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
            "Subtotal",
            "Discount",
            "GST",
            "Service Charge",
            "Grand Total",
            "Payment Method",
            "Payment Status",
            "Date"

        ];


        const rows =
            bills.map(bill => [

                bill.id,

                bill.orderId,

                bill.customer,

                bill.table,

                bill.orderType,

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

            ]);


        const csvContent = [

            headers.join(","),

            ...rows.map(row =>

                row
                    .map(value =>
                        `"${String(value)
                            .replaceAll(
                                '"',
                                '""'
                            )}"`
                    )
                    .join(",")

            )

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
            `alleppey-pub-bills-${Date.now()}.csv`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        showToast(
            "Bills exported successfully.",
            "success"
        );

    }
);


/* =========================================
   ORDER FILTER EVENTS
========================================= */

orderSearch.addEventListener(
    "input",
    renderOrders
);


orderFilterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            orderFilterButtons.forEach(
                filterButton => {

                    filterButton.classList.remove(
                        "active"
                    );

                }
            );

            button.classList.add("active");

            selectedOrderFilter =
                button.dataset.status;

            renderOrders();

        }
    );

});


/* =========================================
   MODAL CLOSE EVENTS
========================================= */

closeCustomItemModalBtn.addEventListener(
    "click",
    () => closeModal(customItemModal)
);

cancelCustomItemModalBtn.addEventListener(
    "click",
    () => closeModal(customItemModal)
);

closeNewBillModalBtn.addEventListener(
    "click",
    () => closeModal(newBillModal)
);

cancelNewBillModalBtn.addEventListener(
    "click",
    () => closeModal(newBillModal)
);

closeReceiptModalBtn.addEventListener(
    "click",
    () => closeModal(receiptModal)
);

cancelDeleteBillBtn.addEventListener(
    "click",
    () => {

        selectedBillId = null;

        closeModal(deleteBillModal);

    }
);


/* =========================================
   OPEN AND CLOSE MODALS
========================================= */

function openModal(modal) {

    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";

}


function closeModal(modal) {

    modal.classList.remove("active");

    const activeModal =
        document.querySelector(
            ".modal-overlay.active"
        );

    if (!activeModal) {

        document.body.style.overflow =
            "";

    }

}


/* =========================================
   CLOSE MODAL ON BACKGROUND CLICK
========================================= */

[
    customItemModal,
    newBillModal,
    receiptModal,
    deleteBillModal

].forEach(modal => {

    modal.addEventListener(
        "click",
        function (event) {

            if (event.target === modal) {

                closeModal(modal);

            }

        }
    );

});


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {

            return;

        }

        document
            .querySelectorAll(
                ".modal-overlay.active"
            )
            .forEach(
                modal =>
                    closeModal(modal)
            );

    }
);


/* =========================================
   GENERATE IDS
========================================= */

function generateOrderId() {

    const numbers =
        orders
            .map(order => {

                const match =
                    String(order.id)
                        .match(/\d+/);

                return match
                    ? Number(match[0])
                    : 0;

            });


    const nextNumber =
        numbers.length > 0
            ? Math.max(...numbers) + 1
            : 1001;


    return `ORD-${nextNumber}`;

}


function generateBillId() {

    const numbers =
        bills
            .map(bill => {

                const match =
                    String(bill.id)
                        .match(/\d+/);

                return match
                    ? Number(match[0])
                    : 0;

            });


    const nextNumber =
        numbers.length > 0
            ? Math.max(...numbers) + 1
            : 5001;


    return `BILL-${nextNumber}`;

}


/* =========================================
   HELPER FUNCTIONS
========================================= */

function calculateOrderTotal(items) {

    return items.reduce(
        (total, item) => {

            return total +
                item.price *
                item.quantity;

        },
        0
    );

}


function formatMoney(value) {

    return Number(value || 0)
        .toFixed(2);

}


function formatTime(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {

        return "\u2014";

    }

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function formatDateTime(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {

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


function getOrderStatusClass(status) {

    const classes = {

        Ready:
            "status-ready",

        Pending:
            "status-pending",

        Paid:
            "status-paid",

        Completed:
            "status-completed"

    };

    return (
        classes[status] ||
        "status-pending"
    );

}


function getPaymentStatusClass(status) {

    const classes = {

        Pending:
            "status-pending",

        Paid:
            "status-paid",

        "Partially Paid":
            "status-partially-paid",

        Refunded:
            "status-refunded"

    };

    return (
        classes[status] ||
        "status-pending"
    );

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

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2600);

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =========================================
   INITIAL EMPTY BILL
========================================= */

function resetBillView() {

    selectedOrderId = null;

    billItems = [];

    selectedOrderTitle.textContent =
        "No Order Selected";

    billCustomerName.textContent = "\u2014";

    billTableNumber.textContent = "\u2014";

    billOrderTime.textContent = "\u2014";

    billOrderType.textContent = "\u2014";

    paymentStatusSelect.value =
        "Pending";

    paymentNotes.value = "";

    resetBillCalculations();

    updateBillStatus("Pending");

    renderBillItems();

}


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializeBillingPage() {

    if (!checkBillingAccess()) {
        return;
    }

    loadData();

    resetBillView();

    renderOrders();

    renderBillingHistory();

    updateStatistics();

    updateOrderDataStatus(true);

    await refreshLiveOrders(false);

    window.setInterval(
        function () {

            if (!document.hidden) {
                refreshLiveOrders(false);
            }

        },
        LIVE_REFRESH_INTERVAL
    );

}


backDashboardBtn.addEventListener(
    "click",
    function () {

        const role = localStorage.getItem("userRole");

        window.location.href =
            role === "admin"
                ? "admin-dashboard.html"
                : "emp_dash.html";

    }
);


refreshOrdersBtn.addEventListener(
    "click",
    function () {
        refreshLiveOrders(true);
    }
);


initializeBillingPage();
