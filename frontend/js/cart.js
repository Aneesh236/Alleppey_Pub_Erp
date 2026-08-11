/* =========================================
   ALLEPPEY PUB ERP - CART PAGE
========================================= */

const CART_STORAGE_KEY = "cart";

const cartItemsContainer = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const itemCount = document.getElementById("itemCount");
const totalItems = document.getElementById("totalItems");
const subtotalElement = document.getElementById("subtotal");
const grandTotalElement = document.getElementById("grandTotal");
const continueBtn = document.getElementById("continueBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const emptyCartTemplate = document.getElementById("emptyCartTemplate");
const toast = document.getElementById("toast");

let cart = loadCart();

/* =========================================
   LOAD CART
========================================= */

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));

        if (!Array.isArray(savedCart)) {
            return [];
        }

        return savedCart.map((item, index) => normalizeCartItem(item, index));
    } catch (error) {
        console.error("Unable to load cart:", error);
        return [];
    }
}

/* =========================================
   NORMALIZE CART ITEM

   Supports both formats:

   {
       title,
       quantity
   }

   and

   {
       name,
       qty
   }
========================================= */

function normalizeCartItem(item, index) {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity ?? item.qty) || 1;

    return {
        id: item.id ?? item.menuId ?? `${item.name ?? item.title ?? "item"}-${index}`,
        name: item.name ?? item.title ?? "Menu Item",
        description: item.description ?? item.desc ?? "",
        price: price,
        quantity: Math.max(1, quantity),
        image: item.image ?? item.img ?? "../img/logo.jpeg"
    };
}

/* =========================================
   SAVE CART
========================================= */

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/* =========================================
   FORMAT CURRENCY
========================================= */

function formatCurrency(value) {
    return Number(value).toFixed(2);
}

/* =========================================
   RENDER CART
========================================= */

function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        showEmptyCart();
        updateSummary();
        return;
    }

    cart.forEach((item, index) => {
        const itemElement = document.createElement("article");

        itemElement.className = "cart-item";
        itemElement.dataset.index = index;

        itemElement.innerHTML = `
            <img
                src="${escapeAttribute(item.image)}"
                alt="${escapeAttribute(item.name)}"
                onerror="this.onerror = null; this.src='../img/fries.png'"
            >

            <div class="item-details">
                <h3>${escapeHTML(item.name)}</h3>

                <p>
                    ${escapeHTML(item.description || "Freshly prepared item")}
                </p>

                <span class="item-price">
                    ₹${formatCurrency(item.price)}
                </span>
            </div>

            <div class="item-actions">

                <div class="quantity">

                    <button
                        type="button"
                        class="decrease-btn"
                        data-action="decrease"
                        aria-label="Decrease ${escapeAttribute(item.name)} quantity">
                        <i class="fa-solid fa-minus"></i>
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        class="increase-btn"
                        data-action="increase"
                        aria-label="Increase ${escapeAttribute(item.name)} quantity">
                        <i class="fa-solid fa-plus"></i>
                    </button>

                </div>

                <button
                    type="button"
                    class="delete-btn"
                    data-action="delete"
                    aria-label="Remove ${escapeAttribute(item.name)} from cart">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        `;

        cartItemsContainer.appendChild(itemElement);
    });

    updateSummary();
}

/* =========================================
   EMPTY CART
========================================= */

function showEmptyCart() {
    if (emptyCartTemplate) {
        cartItemsContainer.appendChild(
            emptyCartTemplate.content.cloneNode(true)
        );
        return;
    }

    cartItemsContainer.innerHTML = `
        <div class="empty-cart">
            <i class="fa-solid fa-cart-shopping"></i>
            <h2>Your Cart is Empty</h2>
            <p>Browse our menu and add your favourite food and drinks.</p>
        </div>
    `;
}

/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {
    const quantityTotal = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    cartCount.textContent =
        `${quantityTotal} ${quantityTotal === 1 ? "Item" : "Items"}`;

    itemCount.textContent =
        `${quantityTotal} ${quantityTotal === 1 ? "Item" : "Items"}`;

    totalItems.textContent = quantityTotal;
    subtotalElement.textContent = formatCurrency(subtotal);
    grandTotalElement.textContent = formatCurrency(subtotal);

    checkoutBtn.disabled = cart.length === 0;
    clearCartBtn.disabled = cart.length === 0;
}

/* =========================================
   CART ITEM ACTIONS
========================================= */

cartItemsContainer.addEventListener("click", function (event) {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) {
        return;
    }

    const cartItem = actionButton.closest(".cart-item");

    if (!cartItem) {
        return;
    }

    const index = Number(cartItem.dataset.index);
    const action = actionButton.dataset.action;

    if (!Number.isInteger(index) || !cart[index]) {
        return;
    }

    if (action === "increase") {
        changeQuantity(index, 1);
    }

    if (action === "decrease") {
        changeQuantity(index, -1);
    }

    if (action === "delete") {
        removeItem(index);
    }
});

/* =========================================
   CHANGE QUANTITY
========================================= */

function changeQuantity(index, change) {
    const newQuantity = cart[index].quantity + change;

    if (newQuantity < 1) {
        removeItem(index);
        return;
    }

    cart[index].quantity = newQuantity;

    saveCart();
    renderCart();
}

/* =========================================
   REMOVE ITEM
========================================= */

function removeItem(index) {
    const removedItem = cart[index];

    cart.splice(index, 1);

    saveCart();
    renderCart();

    showToast(`${removedItem.name} removed from cart.`);
}

/* =========================================
   CONTINUE ORDERING
========================================= */

continueBtn.addEventListener("click", function () {
    window.location.href = "../html/menu.html";
});

/* =========================================
   CLEAR CART
========================================= */

clearCartBtn.addEventListener("click", function () {
    if (cart.length === 0) {
        showToast("Your cart is already empty.");
        return;
    }

    const shouldClear = window.confirm(
        "Are you sure you want to clear the cart?"
    );

    if (!shouldClear) {
        return;
    }

    cart = [];

    saveCart();
    renderCart();

    showToast("Cart cleared successfully.");
});

/* =========================================
   PROCEED TO CHECKOUT
========================================= */

checkoutBtn.addEventListener("click", function () {
    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    saveCart();

    window.location.href = "../html/checkout.html";
});

/* =========================================
   TOAST
========================================= */

let toastTimer;

function showToast(message) {
    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
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
   INITIALIZE CART PAGE
========================================= */

renderCart();
