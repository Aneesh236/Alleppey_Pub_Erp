(() => {
    "use strict";

    const MENU_CACHE_KEY = "pubMenu";
    const CART_STORAGE_KEY = "cart";

    const searchInput =
        document.getElementById("menuSearch");

    const filterButton =
        document.getElementById("filterBtn");

    const categorySection =
        document.querySelector(".category-section");

    const categoryButtons = [
        ...document.querySelectorAll(
            ".menu-categories [data-category]"
        )
    ];

    const menuGrid =
        document.getElementById("menuGrid");

    const emptyState =
        document.getElementById("emptyMenuState");

    const cartCount =
        document.getElementById("cartCount");

    const itemStat = document.querySelector(
        ".hero-stats .stat-card:nth-child(2) strong"
    );

    const panel =
        document.getElementById("productPanel");

    const panelOverlay =
        document.getElementById("panelOverlay");

    const closePanelButton =
        document.getElementById("closePanel");

    const panelImage =
        document.getElementById("panelImage");

    const panelTitle =
        document.getElementById("panelTitle");

    const panelSubtitle =
        document.getElementById("panelSubtitle");

    const panelPrice =
        document.getElementById("panelPrice");

    const panelDescription =
        document.getElementById("panelDescription");

    const panelCategory =
        document.getElementById("panelCategory");

    const panelVolume =
        document.getElementById("panelVolume");

    const panelAlcohol =
        document.getElementById("panelAlcohol");

    const panelOrigin =
        document.getElementById("panelOrigin");

    const quantityElement =
        document.getElementById("qty");

    const minusButton =
        document.getElementById("minusBtn");

    const plusButton =
        document.getElementById("plusBtn");

    const panelAddButton =
        document.getElementById("addCartBtn");

    let menuItems = readStaticCards();
    let activeCategory = "All";
    let searchTerm = "";
    let selectedItem = null;
    let selectedQuantity = 1;
    let toastTimer = null;


    function getApiBaseUrl() {
        const apiBaseUrl = String(
            window.PUB_API_BASE_URL || ""
        ).replace(/\/+$/, "");

        if (!apiBaseUrl) {
            throw new Error(
                "The backend URL is missing from config.js."
            );
        }

        return apiBaseUrl;
    }


    async function fetchMenuFromServer() {
        const response = await fetch(
            `${getApiBaseUrl()}/menu`,
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
            console.error(
                "The server returned an unreadable response.",
                error
            );
        }

        if (!response.ok) {
            throw new Error(
                result?.detail ||
                result?.message ||
                `Server error ${response.status}`
            );
        }

        return Array.isArray(result)
            ? result
            : [];
    }


    function normalizeItem(item, index = 0) {
        return {
            id:
                item.id ??
                item.menuId ??
                `menu-${index + 1}`,

            image: String(
                item.image ||
                "../img/fries.png"
            ),

            name: String(
                item.name ||
                "Menu Item"
            ),

            description: String(
                item.description ||
                "No description available."
            ),

            category: String(
                item.category ||
                "Food"
            ),

            price:
                Number(item.price) || 0,

            status: String(
                item.status ||
                "Available"
            )
        };
    }


    function readStaticCards() {
        return [
            ...document.querySelectorAll(".menu-card")
        ].map((card, index) => {
            const priceText =
                card.querySelector(".price")
                    ?.textContent || "0";

            return normalizeItem(
                {
                    id:
                        card.dataset.id ||
                        card.dataset.product ||
                        `menu-${index + 1}`,

                    image:
                        card.querySelector("img")
                            ?.getAttribute("src"),

                    name:
                        card.querySelector("h3")
                            ?.textContent.trim(),

                    description:
                        card.querySelector(".description")
                            ?.textContent.trim(),

                    category:
                        card.dataset.category,

                    price:
                        priceText.replace(
                            /[^0-9.]/g,
                            ""
                        ),

                    status:
                        card.dataset.status ||
                        "Available"
                },
                index
            );
        });
    }


    function readCachedMenu() {
        try {
            const cached = JSON.parse(
                localStorage.getItem(MENU_CACHE_KEY)
            );

            return Array.isArray(cached)
                ? cached.map(normalizeItem)
                : null;
        } catch (error) {
            return null;
        }
    }


    function cacheMenu() {
        localStorage.setItem(
            MENU_CACHE_KEY,
            JSON.stringify(menuItems)
        );
    }


    async function loadLiveMenu() {
        const cachedMenu = readCachedMenu();

        if (cachedMenu) {
            menuItems = cachedMenu;
        }

        renderMenu();

        try {
            const serverItems =
                await fetchMenuFromServer();

            menuItems =
                serverItems.map(normalizeItem);

            cacheMenu();
            renderMenu();
        } catch (error) {
            console.error(
                "Could not load the live menu.",
                error
            );

            showToast(
                "Live menu unavailable. Showing the saved menu.",
                "error"
            );
        }
    }


    function renderMenu() {
        const visibleItems = menuItems.filter(
            (item) => {
                if (
                    normalize(item.status) === "hidden"
                ) {
                    return false;
                }

                const categoryMatches =
                    activeCategory === "All" ||
                    normalize(item.category) ===
                        normalize(activeCategory);

                const searchableText = normalize(
                    `${item.name} ${item.description} ${item.category}`
                );

                const searchMatches =
                    !searchTerm ||
                    searchableText.includes(
                        normalize(searchTerm)
                    );

                return (
                    categoryMatches &&
                    searchMatches
                );
            }
        );

        menuGrid.innerHTML =
            visibleItems
                .map(createMenuCard)
                .join("");

        emptyState.classList.toggle(
            "show",
            visibleItems.length === 0
        );

        if (itemStat) {
            const availableCount =
                menuItems.filter(
                    (item) =>
                        normalize(item.status) ===
                        "available"
                ).length;

            itemStat.textContent =
                availableCount;
        }
    }


    function createMenuCard(item) {
        const isAvailable =
            normalize(item.status) === "available";

        return `
            <article
                class="menu-card${
                    isAvailable
                        ? ""
                        : " unavailable-card"
                }"
                data-id="${escapeHTML(item.id)}"
                data-category="${escapeHTML(item.category)}"
                data-status="${escapeHTML(item.status)}"
            >

                <div class="card-image">

                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.src='../img/fries.png'"
                    >

                    <span
                        class="card-badge${
                            isAvailable
                                ? ""
                                : " stock-badge"
                        }"
                    >
                        <i class="fa-solid ${
                            isAvailable
                                ? "fa-utensils"
                                : "fa-circle-xmark"
                        }"></i>

                        ${
                            isAvailable
                                ? "Fresh Choice"
                                : "Out of Stock"
                        }
                    </span>

                    <button
                        class="view-details-btn"
                        type="button"
                        data-action="details"
                        aria-label="View ${escapeHTML(item.name)} details"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                </div>

                <div class="menu-content">

                    <div class="card-meta">

                        <span class="category">
                            ${escapeHTML(item.category)}
                        </span>

                        <span class="rating">
                            <i class="fa-solid fa-star"></i>
                            4.8
                        </span>

                    </div>

                    <h3>
                        ${escapeHTML(item.name)}
                    </h3>

                    <p class="description">
                        ${escapeHTML(item.description)}
                    </p>

                    <div class="bottom card-bottom">

                        <div class="price-box">

                            <span class="price-label">
                                Price
                            </span>

                            <span class="price">
                                ${formatCurrency(item.price)}
                            </span>

                        </div>

                        <button
                            class="add-btn"
                            type="button"
                            data-action="add"
                            ${isAvailable ? "" : "disabled"}
                        >
                            <i class="fa-solid ${
                                isAvailable
                                    ? "fa-plus"
                                    : "fa-ban"
                            }"></i>

                            ${
                                isAvailable
                                    ? "Add"
                                    : "Unavailable"
                            }
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    function selectCategory(
        category,
        shouldScroll = false
    ) {
        const matchingButton =
            categoryButtons.find(
                (button) =>
                    normalize(
                        button.dataset.category
                    ) === normalize(category)
            );

        activeCategory =
            matchingButton?.dataset.category ||
            "All";

        categoryButtons.forEach((button) => {
            const isActive =
                button === matchingButton ||
                (
                    !matchingButton &&
                    button.dataset.category === "All"
                );

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        renderMenu();

        if (shouldScroll) {
            document
                .querySelector(".items-section")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        }
    }


    function findItem(id) {
        return menuItems.find(
            (item) =>
                String(item.id) === String(id)
        );
    }


    function openProductPanel(item) {
        selectedItem = item;
        selectedQuantity = 1;

        panelImage.src = item.image;
        panelImage.alt = item.name;

        panelTitle.textContent =
            item.name;

        panelSubtitle.textContent =
            `${item.category} · ${item.status}`;

        panelPrice.textContent =
            formatCurrency(item.price);

        panelDescription.textContent =
            item.description;

        panelCategory.textContent =
            item.category;

        panelVolume.textContent =
            "Standard serving";

        panelAlcohol.textContent =
            isDrinkCategory(item.category)
                ? "Ask our team"
                : "Not applicable";

        panelOrigin.textContent =
            "Alleppey Pub";

        quantityElement.textContent =
            selectedQuantity;

        const isAvailable =
            normalize(item.status) === "available";

        panelAddButton.disabled =
            !isAvailable;

        panelAddButton.innerHTML =
            isAvailable
                ? `
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add to Cart
                `
                : `
                    <i class="fa-solid fa-ban"></i>
                    Currently Unavailable
                `;

        panel.classList.add("open");
        panelOverlay.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }


    function closeProductPanel() {
        panel.classList.remove("open");
        panelOverlay.classList.remove("active");

        document.body.style.overflow = "";
    }


    function readCart() {
        try {
            const cart = JSON.parse(
                localStorage.getItem(
                    CART_STORAGE_KEY
                )
            );

            return Array.isArray(cart)
                ? cart
                : [];
        } catch (error) {
            return [];
        }
    }


    function addToCart(item, quantity = 1) {
        if (
            normalize(item.status) !==
            "available"
        ) {
            showToast(
                `${item.name} is currently unavailable.`,
                "error"
            );

            return;
        }

        const cart = readCart();

        const existingItem = cart.find(
            (entry) =>
                String(entry.id) ===
                String(item.id)
        );

        if (existingItem) {
            existingItem.quantity =
                Math.max(
                    1,
                    Number(
                        existingItem.quantity ??
                        existingItem.qty ??
                        1
                    )
                ) + quantity;

            existingItem.qty =
                existingItem.quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                description: item.description,
                image: item.image,
                price: item.price,
                quantity,
                qty: quantity
            });
        }

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

        updateCartCount();

        showToast(
            `${quantity} × ${item.name} added to your cart.`,
            "success"
        );
    }


    function updateCartCount() {
        const totalQuantity =
            readCart().reduce(
                (total, item) => {
                    return total + Math.max(
                        1,
                        Number(
                            item.quantity ??
                            item.qty ??
                            1
                        )
                    );
                },
                0
            );

        cartCount.textContent =
            totalQuantity;
    }


    function getToast() {
        let toast =
            document.getElementById("toast");

        if (!toast) {
            toast =
                document.createElement("div");

            toast.id = "toast";

            document.body.appendChild(toast);
        }

        return toast;
    }


    function showToast(message, type = "") {
        const toast = getToast();

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

        window.clearTimeout(toastTimer);

        toastTimer = window.setTimeout(
            () => {
                toast.classList.remove("show");
            },
            2600
        );
    }


    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }


    function formatCurrency(value) {
        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
    }


    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function isDrinkCategory(category) {
        return [
            "beer",
            "cocktails",
            "whisky",
            "wine"
        ].includes(
            normalize(category)
        );
    }


    searchInput?.addEventListener(
        "input",
        (event) => {
            searchTerm = event.target.value;
            renderMenu();
        }
    );


    categoryButtons.forEach((button) => {
        button.setAttribute(
            "aria-pressed",
            String(
                button.classList.contains("active")
            )
        );

        button.addEventListener(
            "click",
            () => {
                selectCategory(
                    button.dataset.category,
                    true
                );
            }
        );
    });


    filterButton?.addEventListener(
        "click",
        () => {
            categorySection?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    );


    menuGrid.addEventListener(
        "click",
        (event) => {
            const card =
                event.target.closest(".menu-card");

            if (!card) {
                return;
            }

            const item =
                findItem(card.dataset.id);

            if (!item) {
                return;
            }

            const actionButton =
                event.target.closest(
                    "[data-action]"
                );

            if (
                actionButton?.dataset.action ===
                "add"
            ) {
                addToCart(item, 1);
                return;
            }

            openProductPanel(item);
        }
    );


    closePanelButton.addEventListener(
        "click",
        closeProductPanel
    );

    panelOverlay.addEventListener(
        "click",
        closeProductPanel
    );


    minusButton.addEventListener(
        "click",
        () => {
            selectedQuantity = Math.max(
                1,
                selectedQuantity - 1
            );

            quantityElement.textContent =
                selectedQuantity;
        }
    );


    plusButton.addEventListener(
        "click",
        () => {
            selectedQuantity = Math.min(
                20,
                selectedQuantity + 1
            );

            quantityElement.textContent =
                selectedQuantity;
        }
    );


    panelAddButton.addEventListener(
        "click",
        () => {
            if (!selectedItem) {
                return;
            }

            addToCart(
                selectedItem,
                selectedQuantity
            );

            closeProductPanel();
        }
    );


    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Escape") {
                closeProductPanel();
            }
        }
    );


    const params =
        new URLSearchParams(
            window.location.search
        );

    selectCategory(
        params.get("category") || "All"
    );


    if (
        params.get("focus") === "search" &&
        searchInput
    ) {
        window.setTimeout(
            () => searchInput.focus(),
            150
        );
    }


    updateCartCount();
    loadLiveMenu();
})();