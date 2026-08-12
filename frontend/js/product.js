/* ==========================================
   PRODUCT DATA
========================================== */

const products = {

    lager: {
        id: 1,
        title: "Lager Beer",
        subtitle: "Premium Imported Beer",
        price: 220,
        rating: "4.8 (241 Reviews)",
        image: "../img/lager.jpeg",
        description: "Experience the crisp taste of our signature Lager Beer brewed using premium malt and hops. Smooth, refreshing and best served chilled.",
        volume: "330 ml",
        alcohol: "5%",
        category: "Beer",
        origin: "Germany"
    },

    mojito: {
        id: 2,
        title: "Mojito",
        subtitle: "Refreshing Cocktail",
        price: 350,
        rating: "4.7 (190 Reviews)",
        image: "../img/mojito.jpeg",
        description: "A refreshing blend of lime, mint and soda served over ice.",
        volume: "250 ml",
        alcohol: "0%",
        category: "Cocktail",
        origin: "Cuba"
    },

    burger: {
        id: 3,
        title: "Pub Burger",
        subtitle: "Signature Burger",
        price: 420,
        rating: "4.9 (312 Reviews)",
        image: "../img/burger.jpeg",
        description: "Juicy grilled beef burger served with cheese, lettuce and fries.",
        volume: "450 g",
        alcohol: "-",
        category: "Food",
        origin: "USA"
    },

    wings: {
        id: 4,
        title: "Chicken Wings",
        subtitle: "Crispy Fried",
        price: 390,
        rating: "4.8 (280 Reviews)",
        image: "../img/wings.jpeg",
        description: "Golden fried chicken wings tossed in our signature spicy sauce.",
        volume: "8 Pieces",
        alcohol: "-",
        category: "Food",
        origin: "India"
    },

   margarita: {
    id: 5,
    title: "Margarita",
    subtitle: "Classic Lime Cocktail",
    price: 380,
    rating: "4.8 (205 Reviews)",
    image: "../img/margarita.jpeg",
    description: "A refreshing cocktail prepared with lime, orange flavour and a perfectly salted rim.",
    volume: "250 ml",
    alcohol: "12%",
    category: "Cocktails",
    origin: "Mexico"
},

"grilled-chicken": {
    id: 6,
    title: "Grilled Chicken",
    subtitle: "Chef's Special",
    price: 460,
    rating: "4.9 (186 Reviews)",
    image: "../img/grill.jpeg",
    description: "Tender chicken grilled with pub-style spices and served with vegetables and house sauce.",
    volume: "450 g",
    alcohol: "-",
    category: "Food",
    origin: "India"
},

"house-beer": {
    id: 7,
    title: "House Beer",
    subtitle: "Pub Favourite",
    price: 250,
    rating: "4.7 (174 Reviews)",
    image: "../img/beer.jpeg",
    description: "Smooth and refreshing house beer with a balanced flavour, served perfectly chilled.",
    volume: "500 ml",
    alcohol: "5%",
    category: "Beer",
    origin: "India"
},

"red-wine": {
    id: 8,
    title: "Red Wine",
    subtitle: "Premium House Wine",
    price: 420,
    rating: "4.6 (142 Reviews)",
    image: "../img/wine.png",
    description: "A rich and smooth red wine with fruity notes and an elegant finish.",
    volume: "150 ml",
    alcohol: "13%",
    category: "Wine",
    origin: "France"
},

"french-fries": {
    id: 9,
    title: "French Fries",
    subtitle: "Crispy Quick Bite",
    price: 180,
    rating: "4.7 (220 Reviews)",
    image: "../img/fries.png",
    description: "Golden crispy French fries seasoned with salt and served with tomato ketchup.",
    volume: "250 g",
    alcohol: "-",
    category: "Snacks",
    origin: "Belgium"
},

"chocolate-brownie": {
    id: 10,
    title: "Chocolate Brownie",
    subtitle: "Brownie with Ice Cream",
    price: 240,
    rating: "4.9 (198 Reviews)",
    image: "../img/brownie.png",
    description: "A warm chocolate brownie served with vanilla ice cream and chocolate drizzle.",
    volume: "200 g",
    alcohol: "-",
    category: "Desserts",
    origin: "USA"
}

};


/* ==========================================
   ELEMENTS
========================================== */

const panel = document.getElementById ("productPanel");
const overlay = document.getElementById("panelOverlay");
const closeBtn = document.getElementById("closePanel");

const panelImage = document.getElementById("panelImage");
const panelTitle = document.getElementById("panelTitle");
const panelSubtitle = document.getElementById("panelSubtitle");
const panelRating = document.getElementById("panelRating");
const panelPrice = document.getElementById("panelPrice");
const panelDescription = document.getElementById("panelDescription");
const panelVolume = document.getElementById("panelVolume");
const panelAlcohol = document.getElementById("panelAlcohol");
const panelCategory = document.getElementById("panelCategory");
const panelOrigin = document.getElementById("panelOrigin");

const qty = document.getElementById("qty");
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");
const addCartBtn = document.getElementById("addCartBtn");


/* ==========================================
   VARIABLES
========================================== */

let quantity = 1;
let currentProduct = null;


/* ==========================================
   QUANTITY BUTTONS
========================================== */

function updateQuantityDisplay() {

    qty.innerText = quantity;

}

plusBtn.addEventListener("click", function () {

    quantity++;

    updateQuantityDisplay();

});

minusBtn.addEventListener("click", function () {

    if (quantity > 1) {

        quantity--;

        updateQuantityDisplay();

    }

});


/* ==========================================
   OPEN PRODUCT PANEL
========================================== */

function openProduct(productKey) {

    currentProduct = products[productKey];

    if (!currentProduct) return;

    panelImage.src = currentProduct.image;

    panelTitle.innerText = currentProduct.title;

    panelSubtitle.innerText = currentProduct.subtitle;

    panelRating.innerText = currentProduct.rating;

    panelPrice.innerText = "₹" + currentProduct.price;

    panelDescription.innerText = currentProduct.description;

    panelVolume.innerText = currentProduct.volume;

    panelAlcohol.innerText = currentProduct.alcohol;

    panelCategory.innerText = currentProduct.category;

    panelOrigin.innerText = currentProduct.origin;

    addCartBtn.disabled =
        currentProduct.status === "Out of Stock";

    addCartBtn.title = addCartBtn.disabled
        ? "This item is currently out of stock"
        : "Add this item to the cart";

    quantity = 1;

    updateQuantityDisplay();

    panel.classList.add("open");

    overlay.classList.add("active");

}


/* ==========================================
   CLOSE PRODUCT PANEL
========================================== */

function closeProduct() {

    panel.classList.remove("open");

    overlay.classList.remove("active");

}

closeBtn.addEventListener("click", closeProduct);

overlay.addEventListener("click", closeProduct);

/* ==========================================
   MENU CARD CLICK
========================================== */

document.querySelectorAll(".menu-card").forEach(card => {

    card.addEventListener("click", function (e) {

        // Don't open panel when Add button is clicked
        if (e.target.classList.contains("add-btn")) {
            return;
        }

        const productKey = this.dataset.product;

        openProduct(productKey);

    });

});


/* ==========================================
   CART BADGE
========================================== */

function updateCartBadge() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    let totalItems = 0;

    cart.forEach(item => {

        totalItems += item.quantity;

    });

    const badge = document.getElementById("cartCount");

    if (badge) {

        badge.innerText = totalItems;

    }

}


/* ==========================================
   ADD PRODUCT TO CART
========================================== */

addCartBtn.addEventListener("click", function () {

    if (!currentProduct || currentProduct.status === "Out of Stock") return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingProduct = cart.find(item => item.id === currentProduct.id);

    if (existingProduct) {

        existingProduct.quantity += quantity;

    } else {

        cart.push({

            id: currentProduct.id,

            title: currentProduct.title,

            subtitle: currentProduct.subtitle,

            image: currentProduct.image,

            price: currentProduct.price,

            category: currentProduct.category,

            quantity: quantity

        });

    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartBadge();

    alert(quantity + " × " + currentProduct.title + " added to cart.");

    quantity = 1;

    updateQuantityDisplay();

    closeProduct();

});


/* ==========================================
   QUICK ADD BUTTON ON MENU CARD
========================================== */

document.querySelectorAll(".add-btn").forEach(button => {

    button.addEventListener("click", function (e) {

        e.stopPropagation();

        const card = this.closest(".menu-card");

        const productKey = card.dataset.product;

        const product = products[productKey];

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingProduct = cart.find(item => item.id === product.id);

        if (existingProduct) {

            existingProduct.quantity++;

        } else {

            cart.push({

                id: product.id,

                title: product.title,

                subtitle: product.subtitle,

                image: product.image,

                price: product.price,

                category: product.category,

                quantity: 1

            });

        }

        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartBadge();

        alert(product.title + " added to cart.");

    });

});

/* ==========================================
   SYNC DISPLAYED MENU WITH DATABASE
========================================== */

async function syncMenuFromDatabase() {

    try {

        const databaseItems = await PubAPI.menu.list();

        const byName = new Map(
            databaseItems.map(item => [
                String(item.name).trim().toLowerCase(),
                item
            ])
        );

        Object.entries(products).forEach(([productKey, product]) => {

            const item = byName.get(product.title.toLowerCase());
            const card = document.querySelector(
                `.menu-card[data-product="${productKey}"]`
            );

            if (!card) return;

            if (!item) {
                card.dataset.status = "Hidden";
                card.hidden = true;
                return;
            }

            product.id = item.id;
            product.title = item.name;
            product.subtitle = item.description;
            product.description = item.description;
            product.image = item.image;
            product.price = Number(item.price);
            product.category = item.category;
            product.status = item.status;

            card.dataset.category = item.category;
            card.dataset.status = item.status;
            card.querySelector("img").src = item.image;
            card.querySelector("img").alt = item.name;
            card.querySelector("h3").textContent = item.name;
            card.querySelector(".description").textContent = item.description;
            card.querySelector(".category").textContent = item.category;
            card.querySelector(".price").textContent = `₹${Number(item.price).toFixed(0)}`;

            const addButton = card.querySelector(".add-btn");
            const unavailable = item.status === "Out of Stock";
            addButton.disabled = unavailable;
            addButton.title = unavailable ? "Out of stock" : "Add to cart";
            card.hidden = item.status === "Hidden";
        });

    } catch (error) {

        console.warn(
            "Backend unavailable; showing the built-in menu.",
            error
        );

    }

}


/* ==========================================
   INITIALIZATION
========================================== */

// Update cart badge when page loads
updateCartBadge();

// Reset quantity display
updateQuantityDisplay();

syncMenuFromDatabase();


/* ==========================================
   CLEAR CART (OPTIONAL - FOR TESTING)
   Uncomment only if you want to empty the cart
========================================== */

// localStorage.removeItem("cart");


/* ==========================================
   DEBUG (OPTIONAL)
========================================== */

// View cart in browser console
// console.log(JSON.parse(localStorage.getItem("cart")));


/* ==========================================
   END OF FILE
========================================== */
