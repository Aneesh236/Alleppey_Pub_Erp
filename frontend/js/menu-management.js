"use strict";

const STORAGE_KEY = "pubMenu";
const CATEGORIES = [
    "Beer",
    "Cocktail",
    "Whisky",
    "Wine",
    "Food",
    "Dessert"
];

const STATUSES = [
    "Available",
    "Out of Stock",
    "Hidden"
];


/* ==========================================
   DEFAULT MENU ITEMS
========================================== */

const defaultMenu = [

    {
        id: "menu-lager",
        image: "../img/lager.jpeg",
        name: "Lager Beer",
        description: "Fresh, crisp and perfectly chilled lager beer.",
        category: "Beer",
        price: 6,
        status: "Available",
        createdAt: "2026-07-01T10:00:00"
    },

    {
        id: "menu-mojito",
        image: "../img/mojito.jpeg",
        name: "Mojito",
        description: "A refreshing blend of mint, lime and soda.",
        category: "Cocktail",
        price: 7.5,
        status: "Available",
        createdAt: "2026-07-01T10:05:00"
    },

    {
        id: "menu-burger",
        image: "../img/burger.jpeg",
        name: "Pub Burger",
        description: "Juicy pub-style burger served with crispy fries.",
        category: "Food",
        price: 10,
        status: "Available",
        createdAt: "2026-07-01T10:10:00"
    }

];


/* ==========================================
   HTML ELEMENTS
========================================== */

const elements = {

    table: document.getElementById("menuTable"),

    tableBody: document.getElementById("menuTableBody"),

    emptyState: document.getElementById("emptyState"),

    search: document.getElementById("searchInput"),

    category: document.getElementById("categoryFilter"),

    status: document.getElementById("statusFilter"),

    sort: document.getElementById("sortMenu"),

    filterSummary: document.getElementById("filterSummary"),

    filterSummaryText:
        document.getElementById("filterSummaryText"),

    resultCount:
        document.getElementById("resultCount"),

    menuModal:
        document.getElementById("menuModal"),

    deleteModal:
        document.getElementById("deleteModal"),

    form:
        document.getElementById("menuForm"),

    image:
        document.getElementById("itemImage"),

    name:
        document.getElementById("itemName"),

    description:
        document.getElementById("itemDescription"),

    itemCategory:
        document.getElementById("itemCategory"),

    price:
        document.getElementById("itemPrice"),

    itemStatus:
        document.getElementById("itemStatus"),

    previewImage:
        document.getElementById("previewImage"),

    previewPlaceholder:
        document.getElementById("previewPlaceholder"),

    toast:
        document.getElementById("toast"),

    toastMessage:
        document.getElementById("toastMessage")

};


/* ==========================================
   APPLICATION VARIABLES
========================================== */

let menuItems = loadMenu();

let editingId = null;

let deletingId = null;

let toastTimer = null;


/* ==========================================
   LOAD MENU
========================================== */

function loadMenu() {

    try {

        const savedMenu = localStorage.getItem(STORAGE_KEY);

        const storedItems = JSON.parse(savedMenu);

        if (Array.isArray(storedItems)) {

            const normalizedItems =
                storedItems.map(normalizeItem);

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(normalizedItems)
            );

            return normalizedItems;

        }

    } catch (error) {

        console.warn(
            "The saved menu could not be loaded.",
            error
        );

    }

    const initialItems =
        defaultMenu.map(normalizeItem);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initialItems)
    );

    return initialItems;

}


/* ==========================================
   NORMALIZE MENU ITEM
========================================== */

function normalizeItem(item, index) {

    const createdAt =
        item.createdAt ||
        new Date(Date.now() + index).toISOString();

    return {

        id: String(
            item.id ||
            createId(item.name || "item", createdAt)
        ),

        image: String(
            item.image ||
            item.imageUrl ||
            ""
        ).trim(),

        name: String(
            item.name ||
            "Unnamed item"
        ).trim(),

        description: String(
            item.description ||
            "No description added."
        ).trim(),

        category:
            CATEGORIES.includes(item.category)
                ? item.category
                : "Food",

        price:
            toNumber(item.price),

        status:
            STATUSES.includes(item.status)
                ? item.status
                : "Available",

        createdAt: createdAt

    };

}


/* ==========================================
   CREATE UNIQUE ITEM ID
========================================== */

function createId(name, seed = Date.now()) {

    const slug = String(name)

        .toLowerCase()

        .replace(/[^a-z0-9]+/g, "-")

        .replace(/^-|-$/g, "")

        .slice(0, 24) || "item";

    const datePart = String(seed)

        .replace(/\D/g, "")

        .slice(-8);

    const randomPart = Math.random()

        .toString(36)

        .slice(2, 6);

    return `${slug}-${datePart}-${randomPart}`;

}


/* ==========================================
   CONVERT VALUE TO NUMBER
========================================== */

function toNumber(value) {

    const parsedNumber = Number(

        String(value ?? "")

            .replace(/[^0-9.-]/g, "")

    );

    return Number.isFinite(parsedNumber)
        ? parsedNumber
        : 0;

}


/* ==========================================
   SAVE MENU
========================================== */

function saveMenu() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(menuItems)

    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

    return element.innerHTML;

}


/* ==========================================
   FILTER AND SORT ITEMS
========================================== */

function getVisibleItems() {

    const searchValue =
        elements.search.value
            .trim()
            .toLowerCase();

    const selectedCategory =
        elements.category.value;

    const selectedStatus =
        elements.status.value;

    return menuItems

        .filter((item) => {

            const searchableText = `

                ${item.name}

                ${item.description}

                ${item.category}

            `.toLowerCase();

            const matchesSearch =
                !searchValue ||
                searchableText.includes(searchValue);

            const matchesCategory =
                selectedCategory === "All" ||
                item.category === selectedCategory;

            const matchesStatus =
                selectedStatus === "All" ||
                item.status === selectedStatus;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        })

        .sort((firstItem, secondItem) => {

            switch (elements.sort.value) {

                case "name-desc":

                    return secondItem.name.localeCompare(
                        firstItem.name
                    );

                case "price-high":

                    return (
                        secondItem.price -
                        firstItem.price
                    );

                case "price-low":

                    return (
                        firstItem.price -
                        secondItem.price
                    );

                case "newest":

                    return (
                        new Date(secondItem.createdAt) -
                        new Date(firstItem.createdAt)
                    );

                default:

                    return firstItem.name.localeCompare(
                        secondItem.name
                    );

            }

        });

}


/* ==========================================
   DISPLAY MENU
========================================== */

function renderMenu() {

    const visibleItems =
        getVisibleItems();

    elements.tableBody.innerHTML =
        visibleItems
            .map(itemRow)
            .join("");

    elements.table.hidden =
        visibleItems.length === 0;

    elements.emptyState.hidden =
        visibleItems.length !== 0;

    elements.resultCount.textContent = `

        ${visibleItems.length}

        ${visibleItems.length === 1
            ? "item"
            : "items"}

    `;

    bindImageFallbacks();

    renderStats();

    renderFilterSummary();

}


/* ==========================================
   CREATE TABLE ROW
========================================== */

function itemRow(item) {

    const imageHTML = item.image

        ? `
            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.name)}"
            >
        `

        : "";

    const statusClass = item.status

        .toLowerCase()

        .replaceAll(" ", "-");

    return `

        <tr>

            <td data-label="Item">

                <div class="item-cell">

                    <span class="item-thumb">

                        ${imageHTML}

                        <i
                            class="fa-solid fa-utensils"

                            ${imageHTML
                                ? "hidden"
                                : ""}
                        ></i>

                    </span>

                    <span>

                        <strong class="item-name">

                            ${escapeHTML(item.name)}

                        </strong>

                        <small class="item-code">

                            #${escapeHTML(
                                item.id
                                    .slice(-8)
                                    .toUpperCase()
                            )}

                        </small>

                    </span>

                </div>

            </td>

            <td
                data-label="Description"
                class="description-cell"
            >

                ${escapeHTML(item.description)}

            </td>

            <td data-label="Category">

                <span class="category-badge">

                    <i class="${categoryIcon(
                        item.category
                    )}"></i>

                    ${escapeHTML(item.category)}

                </span>

            </td>

            <td
                data-label="Price"
                class="price-cell"
            >

                £${item.price.toFixed(2)}

            </td>

            <td data-label="Status">

                <span
                    class="status-badge status-${statusClass}"
                >

                    ${escapeHTML(item.status)}

                </span>

            </td>

            <td data-label="Actions">

                <div class="row-actions">

                    <button
                        class="action-button"
                        type="button"
                        data-action="edit"
                        data-id="${escapeHTML(item.id)}"
                        aria-label="Edit ${escapeHTML(item.name)}"
                        title="Edit item"
                    >

                        <i
                            class="fa-regular fa-pen-to-square"
                        ></i>

                    </button>

                    <button
                        class="action-button delete"
                        type="button"
                        data-action="delete"
                        data-id="${escapeHTML(item.id)}"
                        aria-label="Delete ${escapeHTML(item.name)}"
                        title="Delete item"
                    >

                        <i
                            class="fa-regular fa-trash-can"
                        ></i>

                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* ==========================================
   CATEGORY ICONS
========================================== */

function categoryIcon(category) {

    const icons = {

        Beer:
            "fa-solid fa-beer-mug-empty",

        Cocktail:
            "fa-solid fa-martini-glass-citrus",

        Whisky:
            "fa-solid fa-whiskey-glass",

        Wine:
            "fa-solid fa-wine-glass",

        Food:
            "fa-solid fa-burger",

        Dessert:
            "fa-solid fa-ice-cream"

    };

    return (
        icons[category] ||
        "fa-solid fa-utensils"
    );

}


/* ==========================================
   IMAGE ERROR FALLBACK
========================================== */

function bindImageFallbacks() {

    const images =
        elements.tableBody.querySelectorAll(
            ".item-thumb img"
        );

    images.forEach((image) => {

        image.addEventListener(

            "error",

            () => {

                image.hidden = true;

                image.nextElementSibling.hidden =
                    false;

            },

            {
                once: true
            }

        );

    });

}


/* ==========================================
   DISPLAY STATISTICS
========================================== */

function renderStats() {

    const averagePrice =
        menuItems.length

            ? menuItems.reduce(

                (total, item) =>
                    total + item.price,

                0

            ) / menuItems.length

            : 0;

    const availableCount =
        menuItems.filter(

            (item) =>
                item.status === "Available"

        ).length;

    const outOfStockCount =
        menuItems.filter(

            (item) =>
                item.status === "Out of Stock"

        ).length;

    document.getElementById(
        "totalItems"
    ).textContent = menuItems.length;

    document.getElementById(
        "availableItems"
    ).textContent = availableCount;

    document.getElementById(
        "outOfStockItems"
    ).textContent = outOfStockCount;

    document.getElementById(
        "averagePrice"
    ).textContent =
        `£${averagePrice.toFixed(2)}`;

}


/* ==========================================
   FILTER SUMMARY
========================================== */

function renderFilterSummary() {

    const filterParts = [];

    const searchValue =
        elements.search.value.trim();

    if (searchValue) {

        filterParts.push(
            `Search: “${searchValue}”`
        );

    }

    if (elements.category.value !== "All") {

        filterParts.push(
            `Category: ${elements.category.value}`
        );

    }

    if (elements.status.value !== "All") {

        filterParts.push(
            `Status: ${elements.status.value}`
        );

    }

    const searchContainer =
        elements.search.closest(
            ".search-control"
        );

    searchContainer.classList.toggle(

        "has-value",

        Boolean(searchValue)

    );

    elements.filterSummary.hidden =
        filterParts.length === 0;

    elements.filterSummaryText.textContent =
        filterParts.join(" · ");

}


/* ==========================================
   RESET FILTERS
========================================== */

function resetFilters() {

    elements.search.value = "";

    elements.category.value = "All";

    elements.status.value = "All";

    elements.sort.value = "name-asc";

    renderMenu();

}


/* ==========================================
   OPEN ADD OR EDIT MODAL
========================================== */

function openItemModal(itemId = null) {

    editingId = itemId;

    elements.form.reset();

    clearErrors();

    const item = itemId

        ? menuItems.find(

            (entry) =>
                entry.id === itemId

        )

        : null;

    document.getElementById(
        "modalMode"
    ).textContent = item

        ? "EDIT MENU ITEM"

        : "NEW MENU ITEM";

    document.getElementById(
        "modalTitle"
    ).textContent = item

        ? "Edit Menu Item"

        : "Add Menu Item";

    document.getElementById(
        "saveButtonText"
    ).textContent = item

        ? "Update Item"

        : "Save Item";

    if (item) {

        elements.image.value =
            item.image;

        elements.name.value =
            item.name;

        elements.description.value =
            item.description;

        elements.itemCategory.value =
            item.category;

        elements.price.value =
            item.price;

        elements.itemStatus.value =
            item.status;

    } else {

        elements.itemStatus.value =
            "Available";

    }

    updatePreview();

    updateDescriptionCount();

    showModal(elements.menuModal);

}


/* ==========================================
   IMAGE PREVIEW
========================================== */

function updatePreview() {

    const imageSource =
        elements.image.value.trim();

    elements.previewImage.hidden =
        !imageSource;

    elements.previewPlaceholder.hidden =
        Boolean(imageSource);

    if (imageSource) {

        elements.previewImage.src =
            imageSource;

        elements.previewImage.onerror =
            () => {

                elements.previewImage.hidden =
                    true;

                elements.previewPlaceholder.hidden =
                    false;

            };

        elements.previewImage.onload =
            () => {

                elements.previewImage.hidden =
                    false;

                elements.previewPlaceholder.hidden =
                    true;

            };

    } else {

        elements.previewImage.removeAttribute(
            "src"
        );

    }

}


/* ==========================================
   DESCRIPTION CHARACTER COUNT
========================================== */

function updateDescriptionCount() {

    document.getElementById(
        "descriptionCount"
    ).textContent =
        elements.description.value.length;

}


/* ==========================================
   VALIDATE FORM
========================================== */

function validateForm() {

    clearErrors();

    let isValid = true;

    if (!elements.name.value.trim()) {

        document.getElementById(
            "nameError"
        ).textContent =
            "Please enter an item name.";

        isValid = false;

    }

    if (toNumber(elements.price.value) <= 0) {

        document.getElementById(
            "priceError"
        ).textContent =
            "Enter a price greater than zero.";

        isValid = false;

    }

    return isValid;

}


/* ==========================================
   CLEAR FORM ERRORS
========================================== */

function clearErrors() {

    document.getElementById(
        "nameError"
    ).textContent = "";

    document.getElementById(
        "priceError"
    ).textContent = "";

}


/* ==========================================
   SHOW MODAL
========================================== */

function showModal(modal) {

    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );

    window.setTimeout(

        () => {

            modal.querySelector(
                "input, button"
            )?.focus();

        },

        50

    );

}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal(modal) {

    modal.hidden = true;

    if (
        elements.menuModal.hidden &&
        elements.deleteModal.hidden
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/* ==========================================
   SHOW DELETE MODAL
========================================== */

function showDeleteModal(itemId) {

    const item =
        menuItems.find(

            (entry) =>
                entry.id === itemId

        );

    if (!item) {

        return;

    }

    deletingId = itemId;

    document.getElementById(
        "deleteItemName"
    ).textContent = item.name;

    showModal(elements.deleteModal);

}


/* ==========================================
   SHOW NOTIFICATION
========================================== */

function showToast(message) {

    window.clearTimeout(toastTimer);

    elements.toastMessage.textContent =
        message;

    elements.toast.classList.add(
        "show"
    );

    toastTimer = window.setTimeout(

        () => {

            elements.toast.classList.remove(
                "show"
            );

        },

        2700

    );

}


/* ==========================================
   TABLE EDIT AND DELETE BUTTONS
========================================== */

elements.tableBody.addEventListener(

    "click",

    (event) => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) {

            return;

        }

        if (
            button.dataset.action === "edit"
        ) {

            openItemModal(
                button.dataset.id
            );

        }

        if (
            button.dataset.action === "delete"
        ) {

            showDeleteModal(
                button.dataset.id
            );

        }

    }

);


/* ==========================================
   ADD OR UPDATE ITEM
========================================== */

elements.form.addEventListener(

    "submit",

    (event) => {

        event.preventDefault();

        if (!validateForm()) {

            return;

        }

        const existingItem = editingId

            ? menuItems.find(

                (item) =>
                    item.id === editingId

            )

            : null;

        const menuItem = normalizeItem(

            {

                id:
                    existingItem?.id ||
                    createId(
                        elements.name.value
                    ),

                image:
                    elements.image.value,

                name:
                    elements.name.value,

                description:
                    elements.description.value ||
                    "No description added.",

                category:
                    elements.itemCategory.value,

                price:
                    elements.price.value,

                status:
                    elements.itemStatus.value,

                createdAt:
                    existingItem?.createdAt ||
                    new Date().toISOString()

            },

            menuItems.length

        );

        if (existingItem) {

            menuItems = menuItems.map(

                (item) =>
                    item.id === editingId

                        ? menuItem

                        : item

            );

        } else {

            menuItems.push(menuItem);

        }

        saveMenu();

        renderMenu();

        closeModal(elements.menuModal);

        showToast(

            existingItem

                ? `${menuItem.name} was updated`

                : `${menuItem.name} was added to the menu`

        );

        editingId = null;

    }

);


/* ==========================================
   DELETE ITEM
========================================== */

document.getElementById(
    "confirmDelete"
).addEventListener(

    "click",

    () => {

        const item =
            menuItems.find(

                (entry) =>
                    entry.id === deletingId

            );

        if (!item) {

            return;

        }

        menuItems = menuItems.filter(

            (entry) =>
                entry.id !== deletingId

        );

        saveMenu();

        renderMenu();

        closeModal(elements.deleteModal);

        showToast(
            `${item.name} was deleted`
        );

        deletingId = null;

    }

);


/* ==========================================
   FILTER EVENT LISTENERS
========================================== */

elements.search.addEventListener(
    "input",
    renderMenu
);

elements.category.addEventListener(
    "change",
    renderMenu
);

elements.status.addEventListener(
    "change",
    renderMenu
);

elements.sort.addEventListener(
    "change",
    renderMenu
);


/* ==========================================
   FORM EVENT LISTENERS
========================================== */

elements.image.addEventListener(
    "input",
    updatePreview
);

elements.description.addEventListener(
    "input",
    updateDescriptionCount
);


/* ==========================================
   CLEAR SEARCH
========================================== */

document.getElementById(
    "clearSearch"
).addEventListener(

    "click",

    () => {

        elements.search.value = "";

        elements.search.focus();

        renderMenu();

    }

);


/* ==========================================
   BUTTON EVENT LISTENERS
========================================== */

document.getElementById(
    "resetFilters"
).addEventListener(

    "click",

    resetFilters

);

document.getElementById(
    "emptyAction"
).addEventListener(

    "click",

    resetFilters

);

document.getElementById(
    "openModal"
).addEventListener(

    "click",

    () => openItemModal()

);

document.getElementById(
    "closeModal"
).addEventListener(

    "click",

    () => closeModal(
        elements.menuModal
    )

);

document.getElementById(
    "cancelForm"
).addEventListener(

    "click",

    () => closeModal(
        elements.menuModal
    )

);

document.getElementById(
    "cancelDelete"
).addEventListener(

    "click",

    () => closeModal(
        elements.deleteModal
    )

);

document.getElementById(
    "backButton"
).addEventListener(

    "click",

    () => {

        window.location.href =
            "../html/admin-dashboard.html";

    }

);


/* ==========================================
   MODAL BACKDROP
========================================== */

document.querySelectorAll(
    "[data-close]"
).forEach(

    (backdrop) => {

        backdrop.addEventListener(

            "click",

            () => {

                const modal =
                    backdrop.dataset.close === "menu"

                        ? elements.menuModal

                        : elements.deleteModal;

                closeModal(modal);

            }

        );

    }

);


/* ==========================================
   ESCAPE KEY
========================================== */

document.addEventListener(

    "keydown",

    (event) => {

        if (event.key !== "Escape") {

            return;

        }

        if (!elements.deleteModal.hidden) {

            closeModal(
                elements.deleteModal
            );

        } else if (
            !elements.menuModal.hidden
        ) {

            closeModal(
                elements.menuModal
            );

        }

    }

);


/* ==========================================
   UPDATE BETWEEN BROWSER TABS
========================================== */

window.addEventListener(

    "storage",

    (event) => {

        if (event.key !== STORAGE_KEY) {

            return;

        }

        menuItems = loadMenu();

        renderMenu();

        showToast(
            "Menu updated in another tab"
        );

    }

);


/* ==========================================
   DISPLAY CURRENT DATE
========================================== */

document.getElementById(
    "currentDate"
).textContent = new Intl.DateTimeFormat(

    "en-GB",

    {

        weekday: "long",

        day: "2-digit",

        month: "long",

        year: "numeric"

    }

).format(new Date());


/* ==========================================
   START APPLICATION
========================================== */

renderMenu();