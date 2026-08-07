/* =========================================
   ALLEPPEY PUB ERP
   INVENTORY MANAGEMENT
========================================= */

const INVENTORY_STORAGE_KEY = "pubInventory";

let inventoryItems = [];
let editingItemId = null;
let selectedStockItemId = null;
let selectedDeleteItemId = null;


/* =========================================
   HTML ELEMENTS
========================================= */

const inventoryTableBody =
    document.getElementById("inventoryTableBody");

const totalInventoryItems =
    document.getElementById("totalInventoryItems");

const lowStockCount =
    document.getElementById("lowStockCount");

const outOfStockCount =
    document.getElementById("outOfStockCount");

const inventoryValue =
    document.getElementById("inventoryValue");

const displayedItemCount =
    document.getElementById("displayedItemCount");

const emptyInventoryState =
    document.getElementById("emptyInventoryState");

const inventorySearch =
    document.getElementById("inventorySearch");

const categoryFilter =
    document.getElementById("categoryFilter");

const statusFilter =
    document.getElementById("statusFilter");

const resetFiltersBtn =
    document.getElementById("resetFilters");


/* =========================================
   INVENTORY FORM ELEMENTS
========================================= */

const inventoryModal =
    document.getElementById("inventoryModal");

const inventoryForm =
    document.getElementById("inventoryForm");

const modalTitle =
    document.getElementById("modalTitle");

const inventoryItemId =
    document.getElementById("inventoryItemId");

const itemName =
    document.getElementById("itemName");

const itemCategory =
    document.getElementById("itemCategory");

const itemUnit =
    document.getElementById("itemUnit");

const currentStock =
    document.getElementById("currentStock");

const minimumStock =
    document.getElementById("minimumStock");

const costPerUnit =
    document.getElementById("costPerUnit");

const supplierName =
    document.getElementById("supplierName");

const itemNotes =
    document.getElementById("itemNotes");


/* =========================================
   INVENTORY MODAL BUTTONS
========================================= */

const openAddItemModalBtn =
    document.getElementById("openAddItemModal");

const emptyAddItemBtn =
    document.getElementById("emptyAddItemBtn");

const closeInventoryModalBtn =
    document.getElementById("closeInventoryModal");

const cancelInventoryModalBtn =
    document.getElementById("cancelInventoryModal");


/* =========================================
   STOCK MODAL ELEMENTS
========================================= */

const stockModal =
    document.getElementById("stockModal");

const stockModalTitle =
    document.getElementById("stockModalTitle");

const selectedStockItemName =
    document.getElementById("selectedStockItemName");

const stockQuantity =
    document.getElementById("stockQuantity");

const closeStockModalBtn =
    document.getElementById("closeStockModal");

const cancelStockModalBtn =
    document.getElementById("cancelStockModal");

const confirmStockUpdateBtn =
    document.getElementById("confirmStockUpdate");


/* =========================================
   DELETE MODAL ELEMENTS
========================================= */

const deleteInventoryModal =
    document.getElementById("deleteInventoryModal");

const deleteItemName =
    document.getElementById("deleteItemName");

const cancelDeleteItemBtn =
    document.getElementById("cancelDeleteItem");

const confirmDeleteItemBtn =
    document.getElementById("confirmDeleteItem");


/* =========================================
   TOAST
========================================= */

const toast =
    document.getElementById("toast");

let toastTimer;


/* =========================================
   DEFAULT INVENTORY DATA
========================================= */

const defaultInventoryItems = [

    {
        id: 1001,
        name: "Lager Beer",
        category: "Alcohol",
        currentStock: 42,
        unit: "Bottle",
        minimumStock: 15,
        costPerUnit: 120,
        supplier: "Kerala Beverage Suppliers",
        notes: "Premium bottled lager beer"
    },

    {
        id: 1002,
        name: "Mojito Mint",
        category: "Ingredients",
        currentStock: 5,
        unit: "Kilogram",
        minimumStock: 8,
        costPerUnit: 180,
        supplier: "Fresh Farm Produce",
        notes: "Fresh mint used for mojito"
    },

    {
        id: 1003,
        name: "Burger Buns",
        category: "Food",
        currentStock: 25,
        unit: "Piece",
        minimumStock: 10,
        costPerUnit: 25,
        supplier: "Alleppey Bakery",
        notes: "Burger buns for pub burgers"
    },

    {
        id: 1004,
        name: "Chicken Wings",
        category: "Food",
        currentStock: 18,
        unit: "Kilogram",
        minimumStock: 8,
        costPerUnit: 260,
        supplier: "Coastal Meat Suppliers",
        notes: "Fresh chicken wings"
    },

    {
        id: 1005,
        name: "Cheese Slices",
        category: "Ingredients",
        currentStock: 6,
        unit: "Packet",
        minimumStock: 7,
        costPerUnit: 210,
        supplier: "Dairy Foods India",
        notes: "Cheese slices for burgers"
    },

    {
        id: 1006,
        name: "Whisky",
        category: "Alcohol",
        currentStock: 0,
        unit: "Bottle",
        minimumStock: 5,
        costPerUnit: 950,
        supplier: "Kerala Beverage Suppliers",
        notes: "Premium whisky bottles"
    },

    {
        id: 1007,
        name: "French Fries",
        category: "Snacks",
        currentStock: 14,
        unit: "Kilogram",
        minimumStock: 6,
        costPerUnit: 150,
        supplier: "Frozen Food Distributors",
        notes: "Frozen potato fries"
    },

    {
        id: 1008,
        name: "Paper Napkins",
        category: "Supplies",
        currentStock: 12,
        unit: "Packet",
        minimumStock: 10,
        costPerUnit: 75,
        supplier: "Hospitality Supplies Kerala",
        notes: "Dining table napkins"
    }

];


/* =========================================
   LOAD INVENTORY
========================================= */

function loadInventory() {

    try {

        const savedInventory =
            JSON.parse(
                localStorage.getItem(
                    INVENTORY_STORAGE_KEY
                )
            );

        if (
            Array.isArray(savedInventory) &&
            savedInventory.length > 0
        ) {

            inventoryItems =
                savedInventory.map(normalizeInventoryItem);

        } else {

            inventoryItems =
                defaultInventoryItems.map(
                    item => ({ ...item })
                );

            saveInventory();

        }

    } catch (error) {

        console.error(
            "Unable to load inventory:",
            error
        );

        inventoryItems =
            defaultInventoryItems.map(
                item => ({ ...item })
            );

        saveInventory();

    }

}


/* =========================================
   NORMALIZE INVENTORY ITEM
========================================= */

function normalizeInventoryItem(item) {

    return {

        id:
            Number(item.id) ||
            Date.now(),

        name:
            String(item.name || "Inventory Item"),

        category:
            String(item.category || "Supplies"),

        currentStock:
            Number(item.currentStock) || 0,

        unit:
            String(item.unit || "Piece"),

        minimumStock:
            Number(item.minimumStock) || 0,

        costPerUnit:
            Number(item.costPerUnit) || 0,

        supplier:
            String(item.supplier || "Not specified"),

        notes:
            String(item.notes || "")

    };

}


/* =========================================
   SAVE INVENTORY
========================================= */

function saveInventory() {

    localStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify(inventoryItems)
    );

}


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(value) {

    return Number(value).toFixed(2);

}


/* =========================================
   GET STOCK STATUS
========================================= */

function getStockStatus(item) {

    if (item.currentStock <= 0) {

        return "Out of Stock";

    }

    if (
        item.currentStock <=
        item.minimumStock
    ) {

        return "Low Stock";

    }

    return "In Stock";

}


/* =========================================
   GET STATUS CLASS
========================================= */

function getStatusClass(status) {

    if (status === "In Stock") {

        return "status-in-stock";

    }

    if (status === "Low Stock") {

        return "status-low-stock";

    }

    return "status-out-of-stock";

}


/* =========================================
   GET CATEGORY ICON
========================================= */

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


/* =========================================
   RENDER INVENTORY
========================================= */

function renderInventory(items = inventoryItems) {

    inventoryTableBody.innerHTML = "";

    if (items.length === 0) {

        emptyInventoryState.classList.add("show");

        displayedItemCount.textContent =
            "0 Items";

        updateStatistics();

        return;

    }

    emptyInventoryState.classList.remove("show");

    items.forEach(item => {

        const status =
            getStockStatus(item);

        const inventoryItemValue =
            item.currentStock *
            item.costPerUnit;

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>

                <div class="inventory-item-cell">

                    <div class="inventory-item-icon">

                        <i class="fa-solid ${getCategoryIcon(item.category)}"></i>

                    </div>

                    <div class="inventory-item-info">

                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>

                        <small>
                            ${escapeHTML(item.supplier)}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <span class="category-badge">

                    ${escapeHTML(item.category)}

                </span>

            </td>


            <td>

                <span class="stock-value">

                    ${formatQuantity(item.currentStock)}

                </span>

            </td>


            <td>

                ${escapeHTML(item.unit)}

            </td>


            <td>

                <span class="minimum-stock">

                    ${formatQuantity(item.minimumStock)}

                </span>

            </td>


            <td>

                ₹${formatMoney(item.costPerUnit)}

            </td>


            <td>

                <span class="inventory-value">

                    ₹${formatMoney(inventoryItemValue)}

                </span>

            </td>


            <td>

                <span class="stock-status ${getStatusClass(status)}">

                    ${status}

                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn stock-btn"
                        type="button"
                        title="Adjust stock"
                        onclick="openStockModal(${item.id})">

                        <i class="fa-solid fa-boxes-stacked"></i>

                    </button>


                    <button
                        class="action-btn edit-btn"
                        type="button"
                        title="Edit item"
                        onclick="editInventoryItem(${item.id})">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="action-btn delete-btn"
                        type="button"
                        title="Delete item"
                        onclick="openDeleteModal(${item.id})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;

        inventoryTableBody.appendChild(row);

    });

    displayedItemCount.textContent =
        `${items.length} ${
            items.length === 1
                ? "Item"
                : "Items"
        }`;

    updateStatistics();

}


/* =========================================
   FORMAT QUANTITY
========================================= */

function formatQuantity(value) {

    const number = Number(value);

    if (Number.isInteger(number)) {

        return number.toString();

    }

    return number.toFixed(2);

}


/* =========================================
   UPDATE STATISTICS
========================================= */

function updateStatistics() {

    const totalItems =
        inventoryItems.length;

    const lowStockItems =
        inventoryItems.filter(item => {

            return (
                item.currentStock > 0 &&
                item.currentStock <=
                item.minimumStock
            );

        }).length;

    const outOfStockItems =
        inventoryItems.filter(item => {

            return item.currentStock <= 0;

        }).length;

    const totalValue =
        inventoryItems.reduce(
            (total, item) => {

                return total +
                    item.currentStock *
                    item.costPerUnit;

            },
            0
        );

    totalInventoryItems.textContent =
        totalItems;

    lowStockCount.textContent =
        lowStockItems;

    outOfStockCount.textContent =
        outOfStockItems;

    inventoryValue.textContent =
        formatMoney(totalValue);

}


/* =========================================
   FILTER INVENTORY
========================================= */

function filterInventory() {

    const searchValue =
        inventorySearch.value
            .trim()
            .toLowerCase();

    const selectedCategory =
        categoryFilter.value;

    const selectedStatus =
        statusFilter.value;

    const filteredItems =
        inventoryItems.filter(item => {

            const matchesSearch =

                item.name
                    .toLowerCase()
                    .includes(searchValue)

                ||

                item.category
                    .toLowerCase()
                    .includes(searchValue)

                ||

                item.supplier
                    .toLowerCase()
                    .includes(searchValue);


            const matchesCategory =

                selectedCategory === "All"

                ||

                item.category ===
                selectedCategory;


            const matchesStatus =

                selectedStatus === "All"

                ||

                getStockStatus(item) ===
                selectedStatus;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });

    renderInventory(filteredItems);

}


/* =========================================
   SEARCH AND FILTER EVENTS
========================================= */

inventorySearch.addEventListener(
    "input",
    filterInventory
);

categoryFilter.addEventListener(
    "change",
    filterInventory
);

statusFilter.addEventListener(
    "change",
    filterInventory
);


/* =========================================
   RESET FILTERS
========================================= */

resetFiltersBtn.addEventListener(
    "click",
    function () {

        inventorySearch.value = "";

        categoryFilter.value = "All";

        statusFilter.value = "All";

        renderInventory(inventoryItems);

    }
);


/* =========================================
   OPEN ADD ITEM MODAL
========================================= */

function openAddInventoryModal() {

    editingItemId = null;

    modalTitle.textContent =
        "Add New Item";

    inventoryForm.reset();

    inventoryItemId.value = "";

    openModal(inventoryModal);

    setTimeout(() => {

        itemName.focus();

    }, 150);

}


openAddItemModalBtn.addEventListener(
    "click",
    openAddInventoryModal
);


emptyAddItemBtn.addEventListener(
    "click",
    openAddInventoryModal
);


/* =========================================
   EDIT INVENTORY ITEM
========================================= */

function editInventoryItem(id) {

    const item =
        inventoryItems.find(
            inventoryItem =>
                inventoryItem.id === id
        );

    if (!item) {

        showToast(
            "Inventory item not found.",
            "error"
        );

        return;

    }

    editingItemId = id;

    modalTitle.textContent =
        "Edit Inventory Item";

    inventoryItemId.value =
        item.id;

    itemName.value =
        item.name;

    itemCategory.value =
        item.category;

    itemUnit.value =
        item.unit;

    currentStock.value =
        item.currentStock;

    minimumStock.value =
        item.minimumStock;

    costPerUnit.value =
        item.costPerUnit;

    supplierName.value =
        item.supplier === "Not specified"
            ? ""
            : item.supplier;

    itemNotes.value =
        item.notes;

    openModal(inventoryModal);

}


/* =========================================
   SAVE INVENTORY ITEM
========================================= */

inventoryForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const name =
            itemName.value.trim();

        const category =
            itemCategory.value;

        const unit =
            itemUnit.value;

        const stock =
            Number(currentStock.value);

        const minimum =
            Number(minimumStock.value);

        const cost =
            Number(costPerUnit.value);

        const supplier =
            supplierName.value.trim();

        const notes =
            itemNotes.value.trim();


        if (!name) {

            showToast(
                "Please enter an item name.",
                "error"
            );

            itemName.focus();

            return;

        }


        if (!category) {

            showToast(
                "Please select a category.",
                "error"
            );

            itemCategory.focus();

            return;

        }


        if (!unit) {

            showToast(
                "Please select a unit.",
                "error"
            );

            itemUnit.focus();

            return;

        }


        if (
            stock < 0 ||
            minimum < 0 ||
            cost < 0
        ) {

            showToast(
                "Stock and cost values cannot be negative.",
                "error"
            );

            return;

        }


        if (editingItemId !== null) {

            const itemIndex =
                inventoryItems.findIndex(
                    item =>
                        item.id ===
                        editingItemId
                );

            if (itemIndex === -1) {

                showToast(
                    "Unable to update item.",
                    "error"
                );

                return;

            }

            inventoryItems[itemIndex] = {

                ...inventoryItems[itemIndex],

                name,

                category,

                unit,

                currentStock: stock,

                minimumStock: minimum,

                costPerUnit: cost,

                supplier:
                    supplier ||
                    "Not specified",

                notes

            };

            showToast(
                "Inventory item updated successfully.",
                "success"
            );

        } else {

            const newItem = {

                id:
                    generateInventoryId(),

                name,

                category,

                unit,

                currentStock: stock,

                minimumStock: minimum,

                costPerUnit: cost,

                supplier:
                    supplier ||
                    "Not specified",

                notes

            };

            inventoryItems.push(newItem);

            showToast(
                "Inventory item added successfully.",
                "success"
            );

        }

        saveInventory();

        closeModal(inventoryModal);

        inventoryForm.reset();

        editingItemId = null;

        filterInventory();

    }
);


/* =========================================
   GENERATE INVENTORY ID
========================================= */

function generateInventoryId() {

    if (inventoryItems.length === 0) {

        return 1001;

    }

    const ids =
        inventoryItems
            .map(item => Number(item.id))
            .filter(id =>
                Number.isFinite(id)
            );

    if (ids.length === 0) {

        return Date.now();

    }

    return Math.max(...ids) + 1;

}


/* =========================================
   CLOSE INVENTORY MODAL
========================================= */

closeInventoryModalBtn.addEventListener(
    "click",
    function () {

        closeModal(inventoryModal);

    }
);


cancelInventoryModalBtn.addEventListener(
    "click",
    function () {

        closeModal(inventoryModal);

    }
);


/* =========================================
   OPEN STOCK MODAL
========================================= */

function openStockModal(id) {

    const item =
        inventoryItems.find(
            inventoryItem =>
                inventoryItem.id === id
        );

    if (!item) {

        showToast(
            "Inventory item not found.",
            "error"
        );

        return;

    }

    selectedStockItemId = id;

    selectedStockItemName.textContent =
        item.name;

    stockModalTitle.textContent =
        "Update Stock";

    stockQuantity.value = "";

    const addRadio =
        document.querySelector(
            'input[name="stockAction"][value="add"]'
        );

    if (addRadio) {

        addRadio.checked = true;

    }

    openModal(stockModal);

    setTimeout(() => {

        stockQuantity.focus();

    }, 150);

}


/* =========================================
   CONFIRM STOCK UPDATE
========================================= */

confirmStockUpdateBtn.addEventListener(
    "click",
    function () {

        const item =
            inventoryItems.find(
                inventoryItem =>
                    inventoryItem.id ===
                    selectedStockItemId
            );

        if (!item) {

            showToast(
                "Inventory item not found.",
                "error"
            );

            return;

        }

        const quantity =
            Number(stockQuantity.value);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            showToast(
                "Enter a valid stock quantity.",
                "error"
            );

            stockQuantity.focus();

            return;

        }

        const selectedAction =
            document.querySelector(
                'input[name="stockAction"]:checked'
            )?.value;


        if (selectedAction === "remove") {

            if (
                quantity >
                item.currentStock
            ) {

                showToast(
                    "Cannot remove more than the available stock.",
                    "error"
                );

                return;

            }

            item.currentStock -= quantity;

        } else {

            item.currentStock += quantity;

        }


        item.currentStock =
            Number(
                item.currentStock.toFixed(2)
            );

        saveInventory();

        closeModal(stockModal);

        showToast(
            `${item.name} stock updated successfully.`,
            "success"
        );

        selectedStockItemId = null;

        filterInventory();

    }
);


/* =========================================
   CLOSE STOCK MODAL
========================================= */

closeStockModalBtn.addEventListener(
    "click",
    function () {

        closeModal(stockModal);

    }
);


cancelStockModalBtn.addEventListener(
    "click",
    function () {

        closeModal(stockModal);

    }
);


/* =========================================
   OPEN DELETE MODAL
========================================= */

function openDeleteModal(id) {

    const item =
        inventoryItems.find(
            inventoryItem =>
                inventoryItem.id === id
        );

    if (!item) {

        showToast(
            "Inventory item not found.",
            "error"
        );

        return;

    }

    selectedDeleteItemId = id;

    deleteItemName.textContent =
        item.name;

    openModal(deleteInventoryModal);

}


/* =========================================
   CONFIRM DELETE
========================================= */

confirmDeleteItemBtn.addEventListener(
    "click",
    function () {

        const item =
            inventoryItems.find(
                inventoryItem =>
                    inventoryItem.id ===
                    selectedDeleteItemId
            );

        if (!item) {

            showToast(
                "Inventory item not found.",
                "error"
            );

            return;

        }

        inventoryItems =
            inventoryItems.filter(
                inventoryItem =>
                    inventoryItem.id !==
                    selectedDeleteItemId
            );

        saveInventory();

        closeModal(deleteInventoryModal);

        showToast(
            `${item.name} deleted successfully.`,
            "success"
        );

        selectedDeleteItemId = null;

        filterInventory();

    }
);


/* =========================================
   CANCEL DELETE
========================================= */

cancelDeleteItemBtn.addEventListener(
    "click",
    function () {

        closeModal(deleteInventoryModal);

        selectedDeleteItemId = null;

    }
);


/* =========================================
   MODAL FUNCTIONS
========================================= */

function openModal(modal) {

    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";

}


function closeModal(modal) {

    modal.classList.remove("active");

    const anyModalOpen =
        document.querySelector(
            ".modal-overlay.active"
        );

    if (!anyModalOpen) {

        document.body.style.overflow =
            "";

    }

}


/* =========================================
   CLOSE MODALS ON OVERLAY CLICK
========================================= */

[
    inventoryModal,
    stockModal,
    deleteInventoryModal

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
   CLOSE MODAL WITH ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {

            return;

        }

        [
            inventoryModal,
            stockModal,
            deleteInventoryModal

        ].forEach(modal => {

            if (
                modal.classList.contains(
                    "active"
                )
            ) {

                closeModal(modal);

            }

        });

    }
);


/* =========================================
   TOAST MESSAGE
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


/* =========================================
   INITIALIZE INVENTORY PAGE
========================================= */

function initializeInventoryPage() {

    loadInventory();

    renderInventory();

}


initializeInventoryPage();