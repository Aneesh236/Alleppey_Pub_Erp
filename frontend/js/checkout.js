/* =========================================
   ALLEPPEY PUB ERP - CHECKOUT PAGE
========================================= */

const CART_STORAGE_KEY = "cart";
const ORDER_STORAGE_KEY = "pubOrders";
const LATEST_ORDER_KEY = "latestOrder";

const GST_RATE = 0.05;
const SERVICE_CHARGE = 30;
const DISCOUNT_RATE = 0.20;

let cart = [];
let discountAmount = 0;
let appliedCoupon = "";


/* =========================================
   HTML ELEMENTS
========================================= */

const checkoutItems = document.getElementById("checkoutItems");
const summaryItemCount = document.getElementById("summaryItemCount");

const subtotalElement = document.getElementById("subtotal");
const discountElement = document.getElementById("discount");
const gstAmountElement = document.getElementById("gstAmount");
const serviceChargeElement = document.getElementById("serviceCharge");
const grandTotalElement = document.getElementById("grandTotal");

const customerNameInput = document.getElementById("customerName");
const customerPhoneInput = document.getElementById("customerPhone");
const tableNumberInput = document.getElementById("tableNumber");
const notesInput = document.getElementById("notes");

const couponInput = document.getElementById("couponInput");
const applyCouponBtn = document.getElementById("applyCoupon");
const couponMessage = document.getElementById("couponMessage");

const placeOrderBtn = document.getElementById("placeOrderBtn");
const emptyCheckoutTemplate = document.getElementById(
    "emptyCheckoutTemplate"
);

const toast = document.getElementById("toast");


/* =========================================
   LOAD CART
========================================= */

function loadCart() {

    try {

        const storedCart = JSON.parse(
            localStorage.getItem(CART_STORAGE_KEY)
        );

        if (!Array.isArray(storedCart)) {

            cart = [];

            return;

        }

        cart = storedCart.map((item, index) => {

            return normalizeCartItem(item, index);

        });

    } catch (error) {

        console.error("Unable to load cart:", error);

        cart = [];

    }

}


/* =========================================
   NORMALIZE CART ITEM
========================================= */

function normalizeCartItem(item, index) {

    return {

        id:
            item.id ??
            item.menuId ??
            `${item.name ?? item.title ?? "item"}-${index}`,

        name:
            item.name ??
            item.title ??
            "Menu Item",

        description:
            item.description ??
            item.desc ??
            "",

        image:
            item.image ??
            item.img ??
            "../img/fries.png",

        price:
            Number(item.price) || 0,

        quantity:
            Math.max(
                1,
                Number(item.quantity ?? item.qty) || 1
            )

    };

}


/* =========================================
   SAVE CART
========================================= */

function saveCart() {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );

}


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(value) {

    return Number(value).toFixed(2);

}


/* =========================================
   RENDER CHECKOUT ITEMS
========================================= */

function renderCheckoutItems() {

    checkoutItems.innerHTML = "";

    if (cart.length === 0) {

        showEmptyCheckout();

        updateTotals();

        placeOrderBtn.disabled = true;

        return;

    }

    cart.forEach((item) => {

        const itemTotal =
            item.price * item.quantity;

        const checkoutItem =
            document.createElement("div");

        checkoutItem.className = "checkout-item";

        checkoutItem.innerHTML = `

            <img
                src="${escapeAttribute(item.image)}"
                alt="${escapeAttribute(item.name)}"
                onerror="this.src='../img/fries.png'"
            >

            <div class="checkout-item-details">

                <h3>
                    ${escapeHTML(item.name)}
                </h3>

                <p>
                    ${item.quantity} × ₹${formatMoney(item.price)}
                </p>

            </div>

            <span class="checkout-item-price">

                ₹${formatMoney(itemTotal)}

            </span>

        `;

        checkoutItems.appendChild(checkoutItem);

    });

    placeOrderBtn.disabled = false;

    updateTotals();

}


/* =========================================
   EMPTY CHECKOUT
========================================= */

function showEmptyCheckout() {

    if (emptyCheckoutTemplate) {

        checkoutItems.appendChild(
            emptyCheckoutTemplate.content.cloneNode(true)
        );

        return;

    }

    checkoutItems.innerHTML = `

        <div class="empty-checkout">

            <i class="fa-solid fa-cart-shopping"></i>

            <h3>Your cart is empty</h3>

            <p>
                Add items before proceeding to checkout.
            </p>

        </div>

    `;

}


/* =========================================
   CALCULATE SUBTOTAL
========================================= */

function calculateSubtotal() {

    return cart.reduce((total, item) => {

        return total +
            item.price * item.quantity;

    }, 0);

}


/* =========================================
   CALCULATE TOTAL ITEM QUANTITY
========================================= */

function calculateItemCount() {

    return cart.reduce((total, item) => {

        return total + item.quantity;

    }, 0);

}


/* =========================================
   CALCULATE GST
========================================= */

function calculateGST(subtotalAfterDiscount) {

    return subtotalAfterDiscount * GST_RATE;

}


/* =========================================
   UPDATE TOTALS
========================================= */

function updateTotals() {

    const subtotal = calculateSubtotal();

    // Automatically apply 20% discount
    discountAmount = subtotal * DISCOUNT_RATE;

    const subtotalAfterDiscount =
        Math.max(0, subtotal - discountAmount);

    const gstAmount =
        calculateGST(subtotalAfterDiscount);

    const serviceCharge =
        cart.length > 0 ? SERVICE_CHARGE : 0;

    const grandTotal =
        subtotalAfterDiscount +
        gstAmount +
        serviceCharge;

    const itemQuantity =
        calculateItemCount();

    summaryItemCount.textContent =
        `${itemQuantity} ${
            itemQuantity === 1 ? "Item" : "Items"
        }`;

    subtotalElement.textContent =
        formatMoney(subtotal);

    discountElement.textContent =
        formatMoney(discountAmount);

    gstAmountElement.textContent =
        formatMoney(gstAmount);

    serviceChargeElement.textContent =
        formatMoney(serviceCharge);

    grandTotalElement.textContent =
        formatMoney(grandTotal);
}


/* =========================================
   APPLY COUPON
========================================= */

applyCouponBtn.addEventListener(
    "click",
    applyCoupon
);

couponInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            applyCoupon();

        }

    }
);


/* =========================================
   COUPON FUNCTION
========================================= */

function applyCoupon() {

    if (cart.length === 0) {

        showCouponMessage(
            "Your cart is empty.",
            "error"
        );

        return;

    }

    const couponCode =
        couponInput.value
            .trim()
            .toUpperCase();

    const subtotal =
        calculateSubtotal();

    discountAmount = 0;
    appliedCoupon = "";

    switch (couponCode) {

        case "PUB10":

            discountAmount =
                subtotal * 0.10;

            appliedCoupon =
                couponCode;

            showCouponMessage(
                "PUB10 applied: 10% discount.",
                "success"
            );

            break;


        case "HAPPY20":

            discountAmount =
                subtotal * 0.20;

            appliedCoupon =
                couponCode;

            showCouponMessage(
                "HAPPY20 applied: 20% discount.",
                "success"
            );

            break;


        case "SAVE50":

            discountAmount =
                Math.min(50, subtotal);

            appliedCoupon =
                couponCode;

            showCouponMessage(
                "SAVE50 applied: ₹50 discount.",
                "success"
            );

            break;


        case "":

            showCouponMessage(
                "Please enter a coupon code.",
                "error"
            );

            break;


        default:

            showCouponMessage(
                "Invalid coupon code.",
                "error"
            );

    }

    updateTotals();

}


/* =========================================
   COUPON MESSAGE
========================================= */

function showCouponMessage(message, type) {

    couponMessage.textContent = message;

    couponMessage.classList.remove(
        "success",
        "error"
    );

    couponMessage.classList.add(type);

}


/* =========================================
   ORDER TYPE CHANGE
========================================= */

document
    .querySelectorAll(
        'input[name="orderType"]'
    )
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            handleOrderTypeChange
        );

    });


function handleOrderTypeChange() {

    const selectedOrderType =
        getSelectedRadioValue("orderType");

    if (selectedOrderType === "Takeaway") {

        tableNumberInput.value = "";

        tableNumberInput.disabled = true;

        tableNumberInput.placeholder =
            "Not required for takeaway";

    } else {

        tableNumberInput.disabled = false;

        tableNumberInput.placeholder =
            "Example: 5";

    }

}


/* =========================================
   GET SELECTED RADIO VALUE
========================================= */

function getSelectedRadioValue(name) {

    const selectedOption =
        document.querySelector(
            `input[name="${name}"]:checked`
        );

    return selectedOption
        ? selectedOption.value
        : "";

}


/* =========================================
   VALIDATE CHECKOUT
========================================= */

function validateCheckout() {

    if (cart.length === 0) {

        showToast(
            "Your cart is empty.",
            "error"
        );

        return false;

    }

    const customerName =
        customerNameInput.value.trim();

    const phone =
        customerPhoneInput.value.trim();

    const orderType =
        getSelectedRadioValue("orderType");

    const tableNumber =
        tableNumberInput.value.trim();

    const paymentMethod =
        getSelectedRadioValue("payment");


    if (
        phone !== "" &&
        !/^[0-9]{10}$/.test(phone)
    ) {

        showToast(
            "Enter a valid 10-digit phone number.",
            "error"
        );

        customerPhoneInput.focus();

        return false;

    }


    if (
        orderType === "Dine In" &&
        tableNumber === ""
    ) {

        showToast(
            "Please enter the table number.",
            "error"
        );

        tableNumberInput.focus();

        return false;

    }


    if (!paymentMethod) {

        showToast(
            "Please select a payment method.",
            "error"
        );

        return false;

    }


    if (customerName.length > 50) {

        showToast(
            "Customer name is too long.",
            "error"
        );

        customerNameInput.focus();

        return false;

    }

    return true;

}


/* =========================================
   PLACE ORDER
========================================= */

placeOrderBtn.addEventListener(
    "click",
    placeOrder
);


async function placeOrder() {

    if (!validateCheckout()) {

        return;

    }

    placeOrderBtn.disabled = true;

    placeOrderBtn.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Placing Order...

    `;


    const subtotal = calculateSubtotal();

// Apply 20% discount
discountAmount = subtotal * DISCOUNT_RATE;

const subtotalAfterDiscount =
    Math.max(0, subtotal - discountAmount);

const gstAmount =
    calculateGST(subtotalAfterDiscount);

const serviceCharge =
    cart.length > 0 ? SERVICE_CHARGE : 0;

const grandTotal =
    subtotalAfterDiscount +
    gstAmount +
    serviceCharge;


    const orders =
        loadExistingOrders();

    const orderId =
        generateOrderId(orders);


    const customerName =
        customerNameInput.value.trim() ||
        "Walk-in Customer";


    const newOrder = {

        id: orderId,

        customer: customerName,

        phone:
            customerPhoneInput.value.trim() ||
            "Not provided",

        table:
            getSelectedRadioValue("orderType") ===
            "Dine In"
                ? tableNumberInput.value.trim()
                : "Takeaway",

        orderType:
            getSelectedRadioValue("orderType"),

        payment:
            getSelectedRadioValue("payment"),

        items: cart.map((item) => {

            return {

                id: item.id,

                name: item.name,

                description:
                    item.description,

                image:
                    item.image,

                price:
                    item.price,

                qty:
                    item.quantity,

                quantity:
                    item.quantity

            };

        }),

        itemCount:
            calculateItemCount(),

        subtotal:
            Number(
                subtotal.toFixed(2)
            ),

        discount:
            Number(
                discountAmount.toFixed(2)
            ),

        coupon:
            appliedCoupon ||
            "None",

        gst:
            Number(
                gstAmount.toFixed(2)
            ),

        gstRate:
            GST_RATE,

        serviceCharge:
            Number(
                serviceCharge.toFixed(2)
            ),

        total:
            Number(
                grandTotal.toFixed(2)
            ),

        notes:
            notesInput.value.trim() ||
            "None",

        status:
            "Pending",

        date:
            new Date().toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),

        createdAt:
            new Date().toISOString()

    };


    let persistedOrder;

    try {

        persistedOrder = await PubAPI.orders.create(newOrder);

    } catch (error) {

        console.error("Order could not be saved to the database.", error);

        showToast(
            error.message || "The order could not reach the server. Please try again.",
            "error"
        );

        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Place Order
        `;

        return;

    }


    orders.push(persistedOrder);


    localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(orders)
    );


    localStorage.setItem(
        LATEST_ORDER_KEY,
        JSON.stringify(persistedOrder)
    );


    localStorage.removeItem(
        CART_STORAGE_KEY
    );


    cart = [];


    showToast(
        `Order #${persistedOrder.id} placed successfully.`,
        "success"
    );


    setTimeout(() => {

        window.location.href =
            "../html/order-confirm.html";

    }, 1200);

}


/* =========================================
   LOAD EXISTING ORDERS
========================================= */

function loadExistingOrders() {

    try {

        const storedOrders =
            JSON.parse(
                localStorage.getItem(
                    ORDER_STORAGE_KEY
                )
            );

        return Array.isArray(storedOrders)
            ? storedOrders
            : [];

    } catch (error) {

        console.error(
            "Unable to load orders:",
            error
        );

        return [];

    }

}


/* =========================================
   GENERATE ORDER ID
========================================= */

function generateOrderId(orders) {

    if (orders.length === 0) {

        return 1001;

    }

    const validOrderIds =
        orders
            .map((order) =>
                Number(order.id)
            )
            .filter((id) =>
                Number.isFinite(id)
            );


    if (validOrderIds.length === 0) {

        return 1001;

    }

    return Math.max(...validOrderIds) + 1;

}


/* =========================================
   TOAST MESSAGE
========================================= */

let toastTimer;


function showToast(message, type = "") {

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


    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2600);

}


/* =========================================
   SECURITY HELPERS
========================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================
   INITIALIZE CHECKOUT PAGE
========================================= */

function initializeCheckout() {

    loadCart();

    renderCheckoutItems();

    handleOrderTypeChange();

    serviceChargeElement.textContent =
        formatMoney(
            cart.length > 0
                ? SERVICE_CHARGE
                : 0
        );

}


initializeCheckout();
