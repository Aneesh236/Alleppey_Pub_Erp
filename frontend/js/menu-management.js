"use strict";

const MENU_CACHE_KEY = "pubMenu";

let menuItems = [];
let editingItemId = null;

const menuModal = document.getElementById("menuModal");
const menuForm = document.getElementById("menuForm");
const tableBody = document.getElementById("menuTableBody");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const menuMessage = document.getElementById("menuMessage");
const refreshButton = document.getElementById("refreshMenu");
const saveButton = menuForm.querySelector(".save-btn");


function getApiBaseUrl() {
    const apiBaseUrl = String(
        window.PUB_API_BASE_URL || ""
    ).replace(/\/+$/, "");

    if (!apiBaseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return apiBaseUrl;
}


async function apiRequest(path, options = {}) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (response.status === 204) {
        return null;
    }

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        console.error("The server returned an unreadable response.", error);
    }

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            `Server error ${response.status}`
        );
    }

    return result;
}


function fetchMenu() {
    return apiRequest("/menu");
}


function createMenuItem(item) {
    return apiRequest("/menu", {
        method: "POST",
        body: JSON.stringify(item)
    });
}


function updateMenuItem(id, item) {
    return apiRequest(`/menu/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(item)
    });
}


function removeMenuItem(id) {
    return apiRequest(`/menu/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}


function normalizeItem(item) {
    return {
        id: Number(item.id),
        image: String(item.image || "../img/fries.png"),
        name: String(item.name || "Menu Item"),
        description: String(item.description || ""),
        category: String(item.category || "Food"),
        price: Number(item.price) || 0,
        status: String(item.status || "Available")
    };
}


function cacheMenu() {
    localStorage.setItem(
        MENU_CACHE_KEY,
        JSON.stringify(menuItems)
    );
}


function showMessage(message, type = "") {
    menuMessage.textContent = message;
    menuMessage.classList.remove("success", "error");

    if (type) {
        menuMessage.classList.add(type);
    }
}


async function loadMenu(showSuccess = false) {
    refreshButton.disabled = true;
    refreshButton.classList.add("loading");

    showMessage("Loading menu from the database...");

    try {
        const result = await fetchMenu();

        menuItems = Array.isArray(result)
            ? result.map(normalizeItem)
            : [];

        cacheMenu();
        applyFilters();

        showMessage(
            `${menuItems.length} menu ${
                menuItems.length === 1 ? "item" : "items"
            } loaded from the database.`,
            showSuccess ? "success" : ""
        );
    } catch (error) {
        console.error("Could not load the menu.", error);

        try {
            const cached = JSON.parse(
                localStorage.getItem(MENU_CACHE_KEY)
            );

            menuItems = Array.isArray(cached)
                ? cached.map(normalizeItem)
                : [];
        } catch (storageError) {
            menuItems = [];
        }

        applyFilters();

        showMessage(
            `${error.message || "Could not contact the backend."} Showing saved items only.`,
            "error"
        );
    } finally {
        refreshButton.disabled = false;
        refreshButton.classList.remove("loading");
    }
}


function applyFilters() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter.value;

    const filteredItems = menuItems.filter((item) => {
        const matchesSearch =
            !searchTerm ||
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "All" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderMenu(filteredItems);
}


function renderMenu(items) {
    if (items.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    No menu items match the current filters.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = items.map((item) => {
        const statusClass =
            item.status === "Available"
                ? "available"
                : item.status === "Out of Stock"
                    ? "out"
                    : "hidden";

        return `
            <tr>
                <td>
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.src='../img/fries.png'"
                    >
                </td>

                <td>${escapeHTML(item.name)}</td>

                <td>
                    ${escapeHTML(
                        item.description || "No description"
                    )}
                </td>

                <td>${escapeHTML(item.category)}</td>

                <td>${formatCurrency(item.price)}</td>

                <td>
                    <span class="status ${statusClass}">
                        ${escapeHTML(item.status)}
                    </span>
                </td>

                <td>
                    <button
                        class="action-btn edit"
                        type="button"
                        data-action="edit"
                        data-id="${item.id}"
                        aria-label="Edit ${escapeHTML(item.name)}"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        class="action-btn delete"
                        type="button"
                        data-action="delete"
                        data-id="${item.id}"
                        aria-label="Delete ${escapeHTML(item.name)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}


function openMenuModal(title) {
    document.querySelector(
        ".modal-content h2"
    ).textContent = title;

    menuModal.style.display = "flex";
}


function closeMenuModal() {
    menuModal.style.display = "none";

    menuForm.reset();
    editingItemId = null;

    saveButton.disabled = false;

    saveButton.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Item
    `;
}


document
    .getElementById("openModal")
    .addEventListener("click", () => {
        closeMenuModal();
        openMenuModal("Add Menu Item");
    });


document
    .getElementById("closeModal")
    .addEventListener("click", closeMenuModal);


window.addEventListener("click", (event) => {
    if (event.target === menuModal) {
        closeMenuModal();
    }
});


menuForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const item = {
        image: document
            .getElementById("itemImage")
            .value.trim(),

        name: document
            .getElementById("itemName")
            .value.trim(),

        description: document
            .getElementById("itemDescription")
            .value.trim(),

        category: document
            .getElementById("itemCategory")
            .value,

        price: Number(
            document.getElementById("itemPrice").value
        ),

        status: document
            .getElementById("itemStatus")
            .value
    };

    saveButton.disabled = true;

    saveButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Saving...
    `;

    try {
        const savedItem =
            editingItemId === null
                ? await createMenuItem(item)
                : await updateMenuItem(editingItemId, item);

        const normalizedItem = normalizeItem(savedItem);

        const existingIndex = menuItems.findIndex(
            (entry) =>
                Number(entry.id) === normalizedItem.id
        );

        if (existingIndex === -1) {
            menuItems.push(normalizedItem);
        } else {
            menuItems[existingIndex] = normalizedItem;
        }

        cacheMenu();
        applyFilters();
        closeMenuModal();

        showMessage(
            `${normalizedItem.name} was saved to the database.`,
            "success"
        );
    } catch (error) {
        console.error(
            "Could not save the menu item.",
            error
        );

        showMessage(
            error.message || "Could not save the menu item.",
            "error"
        );

        saveButton.disabled = false;

        saveButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Item
        `;
    }
});


function editItem(id) {
    const item = menuItems.find(
        (entry) => Number(entry.id) === Number(id)
    );

    if (!item) {
        return;
    }

    editingItemId = Number(item.id);

    document.getElementById("itemImage").value =
        item.image;

    document.getElementById("itemName").value =
        item.name;

    document.getElementById("itemDescription").value =
        item.description;

    document.getElementById("itemCategory").value =
        item.category;

    document.getElementById("itemPrice").value =
        item.price;

    document.getElementById("itemStatus").value =
        item.status;

    openMenuModal("Edit Menu Item");
}


async function deleteItem(id) {
    const item = menuItems.find(
        (entry) => Number(entry.id) === Number(id)
    );

    if (
        !item ||
        !window.confirm(`Delete ${item.name}?`)
    ) {
        return;
    }

    try {
        await removeMenuItem(id);

        menuItems = menuItems.filter(
            (entry) =>
                Number(entry.id) !== Number(id)
        );

        cacheMenu();
        applyFilters();

        showMessage(
            `${item.name} was deleted from the database.`,
            "success"
        );
    } catch (error) {
        console.error(
            "Could not delete the menu item.",
            error
        );

        showMessage(
            error.message || "Could not delete the menu item.",
            "error"
        );
    }
}


tableBody.addEventListener("click", (event) => {
    const button = event.target.closest(
        "[data-action]"
    );

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editItem(id);
    }

    if (button.dataset.action === "delete") {
        deleteItem(id);
    }
});


searchInput.addEventListener(
    "input",
    applyFilters
);

categoryFilter.addEventListener(
    "change",
    applyFilters
);

refreshButton.addEventListener(
    "click",
    () => loadMenu(true)
);


function formatCurrency(value) {
    return Number(value || 0).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
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


loadMenu();