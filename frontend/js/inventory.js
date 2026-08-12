"use strict";

/* Alleppey Pub ERP - live database inventory management. */

const INVENTORY_STORAGE_KEY = "pubInventory";

let inventoryItems = [];
let editingItemId = null;
let selectedStockItemId = null;
let selectedDeleteItemId = null;
let toastTimer = null;


/* Page elements */

const inventoryTableBody = document.getElementById("inventoryTableBody");
const totalInventoryItems = document.getElementById("totalInventoryItems");
const lowStockCount = document.getElementById("lowStockCount");
const outOfStockCount = document.getElementById("outOfStockCount");
const inventoryValue = document.getElementById("inventoryValue");
const displayedItemCount = document.getElementById("displayedItemCount");
const emptyInventoryState = document.getElementById("emptyInventoryState");
const inventorySearch = document.getElementById("inventorySearch");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const resetFiltersBtn = document.getElementById("resetFilters");
const refreshInventoryBtn = document.getElementById("refreshInventory");

const inventoryModal = document.getElementById("inventoryModal");
const inventoryForm = document.getElementById("inventoryForm");
const modalTitle = document.getElementById("modalTitle");
const inventoryItemId = document.getElementById("inventoryItemId");
const itemName = document.getElementById("itemName");
const itemCategory = document.getElementById("itemCategory");
const itemUnit = document.getElementById("itemUnit");
const currentStock = document.getElementById("currentStock");
const minimumStock = document.getElementById("minimumStock");
const costPerUnit = document.getElementById("costPerUnit");
const supplierName = document.getElementById("supplierName");
const itemNotes = document.getElementById("itemNotes");
const saveInventoryBtn = inventoryForm.querySelector(".save-item-btn");

const openAddItemModalBtn = document.getElementById("openAddItemModal");
const emptyAddItemBtn = document.getElementById("emptyAddItemBtn");
const closeInventoryModalBtn = document.getElementById("closeInventoryModal");
const cancelInventoryModalBtn = document.getElementById("cancelInventoryModal");

const stockModal = document.getElementById("stockModal");
const selectedStockItemName = document.getElementById("selectedStockItemName");
const stockQuantity = document.getElementById("stockQuantity");
const closeStockModalBtn = document.getElementById("closeStockModal");
const cancelStockModalBtn = document.getElementById("cancelStockModal");
const confirmStockUpdateBtn = document.getElementById("confirmStockUpdate");

const deleteInventoryModal = document.getElementById("deleteInventoryModal");
const deleteItemName = document.getElementById("deleteItemName");
const cancelDeleteItemBtn = document.getElementById("cancelDeleteItem");
const confirmDeleteItemBtn = document.getElementById("confirmDeleteItem");
const toast = document.getElementById("toast");


/* API */

function getApiBaseUrl() {
    const apiBaseUrl = String(window.PUB_API_BASE_URL || "").replace(/\/+$/, "");

    if (!apiBaseUrl) {
        throw new Error("The backend URL is missing from config.js.");
    }

    return apiBaseUrl;
}


function getAuthToken() {
    return localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") || "";
}


function endStaffSession() {
    [localStorage, sessionStorage].forEach(storage => {
        [
            "authToken", "loggedInUser", "displayName", "userRole",
            "isLoggedIn", "adminLoggedIn", "employeeLoggedIn", "authExpiresAt"
        ].forEach(key => storage.removeItem(key));
    });
    window.location.replace("role-selection.html");
}


async function apiRequest(path, options = {}) {
    const token = getAuthToken();
    if (!token) {
        endStaffSession();
        throw new Error("Please log in again.");
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (response.status === 204) return null;

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        console.error("The server returned an unreadable response.", error);
    }

    if (response.status === 401 || response.status === 403) {
        endStaffSession();
        throw new Error("Your staff session expired. Please log in again.");
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


function fetchInventory() {
    return apiRequest("/inventory");
}


function createInventoryItem(item) {
    return apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify(item)
    });
}


function updateInventoryItem(id, item) {
    return apiRequest(`/inventory/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(item)
    });
}


function deleteInventoryItem(id) {
    return apiRequest(`/inventory/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}


/* Data */

function normalizeInventoryItem(item) {
    return {
        id: Number(item.id),
        name: String(item.name || "Inventory Item"),
        category: String(item.category || "Supplies"),
        currentStock: numberValue(item.currentStock),
        unit: String(item.unit || "Piece"),
        minimumStock: numberValue(item.minimumStock),
        costPerUnit: numberValue(item.costPerUnit),
        supplier: String(item.supplier || "Not specified"),
        notes: String(item.notes || "")
    };
}


function loadCachedInventory() {
    try {
        const cached = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY));
        inventoryItems = Array.isArray(cached)
            ? cached.map(normalizeInventoryItem)
            : [];
    } catch (error) {
        console.warn("Could not read the saved inventory.", error);
        inventoryItems = [];
    }
}


function cacheInventory() {
    localStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify(inventoryItems)
    );
}


async function refreshInventoryFromApi(showMessage = true) {
    refreshInventoryBtn.disabled = true;
    refreshInventoryBtn.classList.add("loading");

    try {
        const result = await fetchInventory();
        inventoryItems = Array.isArray(result)
            ? result.map(normalizeInventoryItem)
            : [];

        cacheInventory();
        filterInventory();

        if (showMessage) {
            showToast("Inventory loaded from the database.", "success");
        }

        return true;
    } catch (error) {
        console.error("Could not load inventory from the database.", error);

        if (showMessage) {
            showToast(
                `${error.message || "Backend unavailable."} Showing saved inventory.`,
                "error"
            );
        }

        return false;
    } finally {
        refreshInventoryBtn.disabled = false;
        refreshInventoryBtn.classList.remove("loading");
    }
}


/* Display */

function getStockStatus(item) {
    if (item.currentStock <= 0) return "Out of Stock";
    if (item.currentStock <= item.minimumStock) return "Low Stock";
    return "In Stock";
}


function getStatusClass(status) {
    if (status === "In Stock") return "status-in-stock";
    if (status === "Low Stock") return "status-low-stock";
    return "status-out-of-stock";
}


function getCategoryIcon(category) {
    const icons = {
        Beverages: "fa-bottle-water",
        Alcohol: "fa-wine-bottle",
        Food: "fa-burger",
        Ingredients: "fa-leaf",
        Snacks: "fa-bowl-food",
        Supplies: "fa-box"
    };

    return icons[category] || "fa-box";
}


function renderInventory(items = inventoryItems) {
    inventoryTableBody.innerHTML = "";

    if (items.length === 0) {
        emptyInventoryState.classList.add("show");
        displayedItemCount.textContent = "0 Items";
        updateStatistics();
        return;
    }

    emptyInventoryState.classList.remove("show");

    inventoryTableBody.innerHTML = items.map((item) => {
        const status = getStockStatus(item);
        const itemValue = item.currentStock * item.costPerUnit;

        return `
            <tr>
                <td>
                    <div class="inventory-item-cell">
                        <div class="inventory-item-icon">
                            <i class="fa-solid ${getCategoryIcon(item.category)}"></i>
                        </div>
                        <div class="inventory-item-info">
                            <strong>${escapeHTML(item.name)}</strong>
                            <small>${escapeHTML(item.supplier)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="category-badge">${escapeHTML(item.category)}</span>
                </td>
                <td><span class="stock-value">${formatQuantity(item.currentStock)}</span></td>
                <td>${escapeHTML(item.unit)}</td>
                <td><span class="minimum-stock">${formatQuantity(item.minimumStock)}</span></td>
                <td>${formatCurrency(item.costPerUnit)}</td>
                <td><span class="inventory-value">${formatCurrency(itemValue)}</span></td>
                <td>
                    <span class="stock-status ${getStatusClass(status)}">${status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn stock-btn"
                                type="button"
                                data-action="stock"
                                data-id="${item.id}"
                                title="Adjust stock">
                            <i class="fa-solid fa-boxes-stacked"></i>
                        </button>
                        <button class="action-btn edit-btn"
                                type="button"
                                data-action="edit"
                                data-id="${item.id}"
                                title="Edit item">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete-btn"
                                type="button"
                                data-action="delete"
                                data-id="${item.id}"
                                title="Delete item">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    displayedItemCount.textContent =
        `${items.length} ${items.length === 1 ? "Item" : "Items"}`;

    updateStatistics();
}


function updateStatistics() {
    const lowItems = inventoryItems.filter(
        (item) => item.currentStock > 0 && item.currentStock <= item.minimumStock
    ).length;

    const outItems = inventoryItems.filter(
        (item) => item.currentStock <= 0
    ).length;

    const totalValue = inventoryItems.reduce(
        (total, item) => total + item.currentStock * item.costPerUnit,
        0
    );

    totalInventoryItems.textContent = inventoryItems.length;
    lowStockCount.textContent = lowItems;
    outOfStockCount.textContent = outItems;
    inventoryValue.textContent = formatMoney(totalValue);
}


function filterInventory() {
    const searchValue = inventorySearch.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredItems = inventoryItems.filter((item) => {
        const searchableText = `${item.name} ${item.category} ${item.supplier}`.toLowerCase();
        const matchesSearch = !searchValue || searchableText.includes(searchValue);
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const matchesStatus = selectedStatus === "All" || getStockStatus(item) === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderInventory(filteredItems);
}


/* Add and edit item */

function openAddInventoryModal() {
    editingItemId = null;
    modalTitle.textContent = "Add New Item";
    inventoryForm.reset();
    inventoryItemId.value = "";
    openModal(inventoryModal);
    window.setTimeout(() => itemName.focus(), 150);
}


function editInventoryItem(id) {
    const item = inventoryItems.find((entry) => entry.id === id);

    if (!item) {
        showToast("Inventory item not found.", "error");
        return;
    }

    editingItemId = id;
    modalTitle.textContent = "Edit Inventory Item";
    inventoryItemId.value = item.id;
    itemName.value = item.name;
    itemCategory.value = item.category;
    itemUnit.value = item.unit;
    currentStock.value = item.currentStock;
    minimumStock.value = item.minimumStock;
    costPerUnit.value = item.costPerUnit;
    supplierName.value = item.supplier === "Not specified" ? "" : item.supplier;
    itemNotes.value = item.notes;
    openModal(inventoryModal);
}


inventoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        name: itemName.value.trim(),
        category: itemCategory.value,
        currentStock: Number(currentStock.value),
        unit: itemUnit.value,
        minimumStock: Number(minimumStock.value),
        costPerUnit: Number(costPerUnit.value),
        supplier: supplierName.value.trim() || "Not specified",
        notes: itemNotes.value.trim()
    };

    if (!payload.name) {
        showToast("Please enter an item name.", "error");
        itemName.focus();
        return;
    }

    if (!payload.category || !payload.unit) {
        showToast("Please select a category and unit.", "error");
        return;
    }

    if (
        !Number.isFinite(payload.currentStock) ||
        !Number.isFinite(payload.minimumStock) ||
        !Number.isFinite(payload.costPerUnit) ||
        payload.currentStock < 0 ||
        payload.minimumStock < 0 ||
        payload.costPerUnit < 0
    ) {
        showToast("Stock and cost values must be valid positive numbers.", "error");
        return;
    }

    setButtonLoading(saveInventoryBtn, true, "Saving...");

    try {
        const savedItem = editingItemId === null
            ? await createInventoryItem(payload)
            : await updateInventoryItem(editingItemId, payload);

        const normalizedItem = normalizeInventoryItem(savedItem);
        const existingIndex = inventoryItems.findIndex(
            (item) => item.id === normalizedItem.id
        );

        if (existingIndex === -1) inventoryItems.push(normalizedItem);
        else inventoryItems[existingIndex] = normalizedItem;

        cacheInventory();
        filterInventory();
        closeModal(inventoryModal);
        inventoryForm.reset();
        editingItemId = null;

        showToast(
            existingIndex === -1
                ? "Inventory item added to the database."
                : "Inventory item updated in the database.",
            "success"
        );
    } catch (error) {
        console.error("Could not save the inventory item.", error);
        showToast(error.message || "Could not save the inventory item.", "error");
    } finally {
        setButtonLoading(saveInventoryBtn, false, "Save Inventory Item");
    }
});


/* Stock adjustment */

function openStockModal(id) {
    const item = inventoryItems.find((entry) => entry.id === id);

    if (!item) {
        showToast("Inventory item not found.", "error");
        return;
    }

    selectedStockItemId = id;
    selectedStockItemName.textContent = item.name;
    stockQuantity.value = "";

    const addRadio = document.querySelector('input[name="stockAction"][value="add"]');
    if (addRadio) addRadio.checked = true;

    openModal(stockModal);
    window.setTimeout(() => stockQuantity.focus(), 150);
}


confirmStockUpdateBtn.addEventListener("click", async () => {
    const item = inventoryItems.find((entry) => entry.id === selectedStockItemId);
    const quantity = Number(stockQuantity.value);
    const action = document.querySelector('input[name="stockAction"]:checked')?.value;

    if (!item) {
        showToast("Inventory item not found.", "error");
        return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        showToast("Enter a valid stock quantity.", "error");
        stockQuantity.focus();
        return;
    }

    if (action === "remove" && quantity > item.currentStock) {
        showToast("Cannot remove more than the available stock.", "error");
        return;
    }

    const newStock = action === "remove"
        ? item.currentStock - quantity
        : item.currentStock + quantity;

    const payload = {
        ...item,
        currentStock: Number(newStock.toFixed(2))
    };

    setButtonLoading(confirmStockUpdateBtn, true, "Updating...");

    try {
        const savedItem = await updateInventoryItem(item.id, payload);
        Object.assign(item, normalizeInventoryItem(savedItem));
        cacheInventory();
        filterInventory();
        closeModal(stockModal);
        selectedStockItemId = null;
        showToast(`${item.name} stock updated in the database.`, "success");
    } catch (error) {
        console.error("Could not update the stock.", error);
        showToast(error.message || "Could not update the stock.", "error");
    } finally {
        setButtonLoading(confirmStockUpdateBtn, false, "Update Stock");
    }
});


/* Delete */

function openDeleteModal(id) {
    const item = inventoryItems.find((entry) => entry.id === id);

    if (!item) {
        showToast("Inventory item not found.", "error");
        return;
    }

    selectedDeleteItemId = id;
    deleteItemName.textContent = item.name;
    openModal(deleteInventoryModal);
}


confirmDeleteItemBtn.addEventListener("click", async () => {
    const item = inventoryItems.find((entry) => entry.id === selectedDeleteItemId);

    if (!item) {
        showToast("Inventory item not found.", "error");
        return;
    }

    setButtonLoading(confirmDeleteItemBtn, true, "Deleting...");

    try {
        await deleteInventoryItem(item.id);
        inventoryItems = inventoryItems.filter((entry) => entry.id !== item.id);
        cacheInventory();
        filterInventory();
        closeModal(deleteInventoryModal);
        selectedDeleteItemId = null;
        showToast(`${item.name} was deleted from the database.`, "success");
    } catch (error) {
        console.error("Could not delete the inventory item.", error);
        showToast(error.message || "Could not delete the inventory item.", "error");
    } finally {
        setButtonLoading(confirmDeleteItemBtn, false, "Delete Item");
    }
});


/* Events */

inventoryTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "stock") openStockModal(id);
    if (button.dataset.action === "edit") editInventoryItem(id);
    if (button.dataset.action === "delete") openDeleteModal(id);
});


inventorySearch.addEventListener("input", filterInventory);
categoryFilter.addEventListener("change", filterInventory);
statusFilter.addEventListener("change", filterInventory);

resetFiltersBtn.addEventListener("click", () => {
    inventorySearch.value = "";
    categoryFilter.value = "All";
    statusFilter.value = "All";
    filterInventory();
});

refreshInventoryBtn.addEventListener("click", () => refreshInventoryFromApi(true));
openAddItemModalBtn.addEventListener("click", openAddInventoryModal);
emptyAddItemBtn.addEventListener("click", openAddInventoryModal);
closeInventoryModalBtn.addEventListener("click", () => closeModal(inventoryModal));
cancelInventoryModalBtn.addEventListener("click", () => closeModal(inventoryModal));
closeStockModalBtn.addEventListener("click", () => closeModal(stockModal));
cancelStockModalBtn.addEventListener("click", () => closeModal(stockModal));

cancelDeleteItemBtn.addEventListener("click", () => {
    selectedDeleteItemId = null;
    closeModal(deleteInventoryModal);
});

[inventoryModal, stockModal, deleteInventoryModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal);
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    [inventoryModal, stockModal, deleteInventoryModal].forEach((modal) => {
        if (modal.classList.contains("active")) closeModal(modal);
    });
});


/* Helpers */

function openModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}


function closeModal(modal) {
    modal.classList.remove("active");

    if (!document.querySelector(".modal-overlay.active")) {
        document.body.style.overflow = "";
    }
}


function setButtonLoading(button, loading, label) {
    button.disabled = loading;
    button.innerHTML = loading
        ? `<i class="fa-solid fa-spinner fa-spin"></i> ${label}`
        : `<i class="fa-solid fa-${button === confirmDeleteItemBtn ? "trash" : button === confirmStockUpdateBtn ? "check" : "floppy-disk"}"></i> ${label}`;
}


function showToast(message, type = "") {
    toast.textContent = message;
    toast.classList.remove("show", "success", "error");
    if (type) toast.classList.add(type);
    toast.classList.add("show");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}


function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function formatMoney(value) {
    return numberValue(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatCurrency(value) {
    return numberValue(value).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}


function formatQuantity(value) {
    const number = numberValue(value);
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function initializeInventoryPage() {
    loadCachedInventory();
    renderInventory();
    refreshInventoryFromApi(false);
}


initializeInventoryPage();
