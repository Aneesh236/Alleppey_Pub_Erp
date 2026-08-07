/* =========================================
   ALLEPPEY PUB ERP
   ORDER CONFIRMATION
========================================= */

const LAST_ORDER_KEY = "lastOrder";
const ORDER_STORAGE_KEY = "pubOrders";
const CART_STORAGE_KEY = "pubCart";

let currentOrder = null;
let toastTimer;


/* =========================================
   ELEMENTS
========================================= */

const orderIdElement =
    document.getElementById("orderId");

const orderDateElement =
    document.getElementById("orderDate");

const orderTimeElement =
    document.getElementById("orderTime");

const customerNameElement =
    document.getElementById("customerName");

const tableNumberElement =
    document.getElementById("tableNumber");

const orderTypeElement =
    document.getElementById("orderType");

const paymentMethodElement =
    document.getElementById("paymentMethod");

const orderStatusElement =
    document.getElementById("orderStatus");

const prepTimeElement =
    document.getElementById("prepTime");

const preparationProgress =
    document.getElementById("preparationProgress");


const orderItemsBody =
    document.getElementById("orderItems");

const orderItemCount =
    document.getElementById("orderItemCount");

const emptyItems =
    document.getElementById("emptyItems");


const subtotalElement =
    document.getElementById("subtotal");

const discountElement =
    document.getElementById("discount");

const gstAmountElement =
    document.getElementById("gstAmount");

const serviceChargeElement =
    document.getElementById("serviceCharge");

const grandTotalElement =
    document.getElementById("grandTotal");


const printReceiptBtn =
    document.getElementById("printReceipt");

const newOrderBtn =
    document.getElementById("newOrder");

const goHomeBtn =
    document.getElementById("goHome");

const toast =
    document.getElementById("toast");


/* =========================================
   LOAD ORDER
========================================= */

function loadConfirmedOrder() {

    try {

        const savedLastOrder =
            JSON.parse(
                localStorage.getItem(
                    LAST_ORDER_KEY
                )
            );


        if (savedLastOrder) {

            currentOrder =
                normalizeOrder(
                    savedLastOrder
                );

            return;

        }


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

            currentOrder =
                normalizeOrder(
                    savedOrders[
                        savedOrders.length - 1
                    ]
                );

            return;

        }


        currentOrder =
            createDemoOrder();

    } catch (error) {

        console.error(
            "Unable to load confirmed order:",
            error
        );

        currentOrder =
            createDemoOrder();

    }

}


/* =========================================
   NORMALIZE ORDER
========================================= */

function normalizeOrder(order) {

    const items =
        Array.isArray(order.items)
            ? order.items.map(
                normalizeItem
            )
            : [];


    const subtotal =
        Number(
            order.subtotal
        ) ||
        calculateItemsTotal(items);


    const discount =
        Number(
            order.discount ||
            order.discountAmount
        ) || 0;


    const gst =
        Number(
            order.gst ||
            order.gstAmount
        ) || 0;


    const serviceCharge =
        Number(
            order.serviceCharge ||
            order.serviceChargeAmount
        ) || 0;


    const total =
        Number(
            order.total ||
            order.grandTotal
        ) ||
        Math.max(
            0,
            subtotal -
            discount +
            gst +
            serviceCharge
        );


    return {

        id:
            String(
                order.id ||
                order.orderId ||
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

        paymentMethod:
            String(
                order.paymentMethod ||
                order.payment ||
                "Cash"
            ),

        status:
            String(
                order.status ||
                "Confirmed"
            ),

        createdAt:
            order.createdAt ||
            order.time ||
            new Date().toISOString(),

        preparationTime:
            Number(
                order.preparationTime ||
                order.prepTime
            ) || calculatePreparationTime(items),

        items,

        subtotal,

        discount,

        gst,

        serviceCharge,

        total

    };

}


/* =========================================
   NORMALIZE ITEM
========================================= */

function normalizeItem(item) {

    return {

        id:
            item.id ||
            Date.now() +
            Math.floor(
                Math.random() * 1000
            ),

        name:
            String(
                item.name ||
                item.itemName ||
                "Menu Item"
            ),

        price:
            Number(
                item.price
            ) || 0,

        quantity:
            Math.max(
                1,
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                )
            ),

        notes:
            String(
                item.notes ||
                ""
            )

    };

}


/* =========================================
   DEMO ORDER
========================================= */

function createDemoOrder() {

    const items = [

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

    ];


    const subtotal =
        calculateItemsTotal(items);


    const gst =
        subtotal * 0.05;


    return {

        id: "ORD-1001",

        customer: "Walk-in Customer",

        table: "05",

        orderType: "Dine In",

        paymentMethod: "Cash",

        status: "Confirmed",

        createdAt:
            new Date().toISOString(),

        preparationTime: 18,

        items,

        subtotal,

        discount: 0,

        gst,

        serviceCharge: 0,

        total:
            subtotal + gst

    };

}


/* =========================================
   RENDER ORDER
========================================= */

function renderConfirmedOrder() {

    if (!currentOrder) {

        showToast(
            "Order details could not be loaded.",
            "error"
        );

        return;

    }


    const orderDate =
        new Date(
            currentOrder.createdAt
        );


    orderIdElement.textContent =
        currentOrder.id;

    orderDateElement.textContent =
        formatDate(orderDate);

    orderTimeElement.textContent =
        formatTime(orderDate);

    customerNameElement.textContent =
        currentOrder.customer;

    tableNumberElement.textContent =
        currentOrder.table;

    orderTypeElement.textContent =
        currentOrder.orderType;

    paymentMethodElement.textContent =
        currentOrder.paymentMethod;

    orderStatusElement.textContent =
        currentOrder.status;

    prepTimeElement.textContent =
        `${currentOrder.preparationTime} Minutes`;


    subtotalElement.textContent =
        formatCurrency(
            currentOrder.subtotal
        );

    discountElement.textContent =
        `- ${formatCurrency(
            currentOrder.discount
        )}`;

    gstAmountElement.textContent =
        formatCurrency(
            currentOrder.gst
        );

    serviceChargeElement.textContent =
        formatCurrency(
            currentOrder.serviceCharge
        );

    grandTotalElement.textContent =
        formatCurrency(
            currentOrder.total
        );


    renderOrderItems();

    updatePreparationProgress();

}


/* =========================================
   RENDER ITEMS
========================================= */

function renderOrderItems() {

    orderItemsBody.innerHTML = "";


    if (
        !Array.isArray(
            currentOrder.items
        ) ||
        currentOrder.items.length === 0
    ) {

        emptyItems.classList.add(
            "show"
        );

        orderItemCount.textContent =
            "0 Items";

        return;

    }


    emptyItems.classList.remove(
        "show"
    );


    currentOrder.items.forEach(item => {

        const itemTotal =
            item.price *
            item.quantity;


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>

                <div class="item-name-cell">

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <small>
                        ${escapeHTML(
                            item.notes ||
                            "No special instructions"
                        )}
                    </small>

                </div>

            </td>


            <td>
                ${formatCurrency(item.price)}
            </td>


            <td>
                ${item.quantity}
            </td>


            <td>

                <span class="item-total">

                    ${formatCurrency(itemTotal)}

                </span>

            </td>

        `;


        orderItemsBody.appendChild(
            row
        );

    });


    const totalQuantity =
        currentOrder.items.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    orderItemCount.textContent =
        `${totalQuantity} ${
            totalQuantity === 1
                ? "Item"
                : "Items"
        }`;

}


/* =========================================
   PREPARATION PROGRESS
========================================= */

function updatePreparationProgress() {

    const status =
        currentOrder.status
            .toLowerCase();


    let progress = 32;


    if (
        status === "preparing" ||
        status === "in preparation"
    ) {

        progress = 65;

    } else if (
        status === "ready" ||
        status === "completed"
    ) {

        progress = 100;

    }


    preparationProgress.style.width =
        `${progress}%`;

}


/* =========================================
   PRINT RECEIPT
========================================= */

printReceiptBtn.addEventListener(
    "click",
    function () {

        window.print();

    }
);


/* =========================================
   NEW ORDER
========================================= */

newOrderBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            CART_STORAGE_KEY
        );

        localStorage.removeItem(
            LAST_ORDER_KEY
        );


        window.location.href =
            "../html/menu.html";

    }
);


/* =========================================
   GO HOME
========================================= */

goHomeBtn.addEventListener(
    "click",
    function () {

        window.location.href =
            "../html/customer-home.html";

    }
);


/* =========================================
   HELPERS
========================================= */

function calculateItemsTotal(items) {

    return items.reduce(
        (total, item) => {

            return (
                total +
                Number(item.price || 0) *
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                )
            );

        },
        0
    );

}


function calculatePreparationTime(items) {

    const totalQuantity =
        items.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    return Math.min(
        35,
        Math.max(
            12,
            10 + totalQuantity * 2
        )
    );

}


function generateOrderId() {

    return (
        "ORD-" +
        String(
            Date.now()
        ).slice(-6)
    );

}


function formatCurrency(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );

}


function formatDate(date) {

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


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

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


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


/* =========================================
   TOAST
========================================= */

function showToast(
    message,
    type = ""
) {

    toast.textContent =
        message;


    toast.classList.remove(
        "show",
        "success",
        "error"
    );


    if (type) {

        toast.classList.add(
            type
        );

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
   INITIALIZE
========================================= */

function initializeConfirmationPage() {

    loadConfirmedOrder();

    renderConfirmedOrder();

}


initializeConfirmationPage();