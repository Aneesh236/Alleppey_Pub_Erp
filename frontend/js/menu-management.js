/* Alleppey Pub ERP - database-backed menu management. */
"use strict";

const MENU_CACHE_KEY = "pubMenu";
let menuItems = [];
let editingItemId = null;

const menuModal = document.getElementById("menuModal");
const menuForm = document.getElementById("menuForm");
const tableBody = document.getElementById("menuTableBody");

const fallbackMenu = [
    {
        id: 1,
        image: "../img/lager.jpeg",
        name: "Lager Beer",
        description: "Crisp premium lager served chilled.",
        category: "Beer",
        price: 220,
        status: "Available"
    },
    {
        id: 2,
        image: "../img/mojito.jpeg",
        name: "Mojito",
        description: "Fresh mint, lime and soda.",
        category: "Cocktails",
        price: 350,
        status: "Available"
    },
    {
        id: 3,
        image: "../img/burger.jpeg",
        name: "Pub Burger",
        description: "Signature burger served with fries.",
        category: "Food",
        price: 420,
        status: "Available"
    }
];

function readCachedMenu() {
    try {
        const saved = JSON.parse(localStorage.getItem(MENU_CACHE_KEY));
        return Array.isArray(saved) && saved.length ? saved : fallbackMenu;
    } catch (_) {
        return fallbackMenu;
    }
}

function cacheMenu() {
    localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menuItems));
}

async function loadMenu() {
    menuItems = readCachedMenu();
    renderMenu(menuItems);

    try {
        menuItems = await PubAPI.menu.list();
        cacheMenu();
        renderMenu(menuItems);
    } catch (error) {
        console.warn("Backend unavailable; showing cached menu.", error);
    }
}

function escapeHTML(value) {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
}

function renderMenu(items) {
    tableBody.innerHTML = items.map(item => {
        const statusClass = item.status === "Available"
            ? "available"
            : item.status === "Out of Stock" ? "out" : "hidden";

        return `
            <tr>
                <td><img src="${escapeHTML(item.image)}" alt="" width="70"></td>
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.description)}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>₹${Number(item.price).toFixed(2)}</td>
                <td><span class="status ${statusClass}">${escapeHTML(item.status)}</span></td>
                <td>
                    <button class="action-btn edit" type="button" onclick="editItem(${Number(item.id)})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" type="button" onclick="deleteItem(${Number(item.id)})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    }).join("");
}

function openMenuModal(title) {
    document.querySelector(".modal-content h2").innerText = title;
    menuModal.style.display = "flex";
}

document.getElementById("openModal").onclick = () => {
    editingItemId = null;
    menuForm.reset();
    openMenuModal("Add Menu Item");
};

document.getElementById("closeModal").onclick = () => {
    menuModal.style.display = "none";
};

window.addEventListener("click", event => {
    if (event.target === menuModal) menuModal.style.display = "none";
});

menuForm.addEventListener("submit", async event => {
    event.preventDefault();

    const item = {
        image: document.getElementById("itemImage").value.trim(),
        name: document.getElementById("itemName").value.trim(),
        description: document.getElementById("itemDescription").value.trim(),
        category: document.getElementById("itemCategory").value,
        price: Number(document.getElementById("itemPrice").value),
        status: document.getElementById("itemStatus").value
    };

    try {
        const savedItem = editingItemId === null
            ? await PubAPI.menu.create(item)
            : await PubAPI.menu.update(editingItemId, item);

        const index = menuItems.findIndex(existing => Number(existing.id) === Number(savedItem.id));
        if (index === -1) menuItems.push(savedItem);
        else menuItems[index] = savedItem;
    } catch (error) {
        const localItem = { ...item, id: editingItemId ?? Date.now() };
        const index = menuItems.findIndex(existing => Number(existing.id) === Number(localItem.id));
        if (index === -1) menuItems.push(localItem);
        else menuItems[index] = localItem;
        alert(`Saved only in this browser because the backend is unavailable. ${error.message}`);
    }

    cacheMenu();
    renderMenu(menuItems);
    menuModal.style.display = "none";
    menuForm.reset();
    editingItemId = null;
});

function editItem(id) {
    const item = menuItems.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    editingItemId = Number(item.id);
    document.getElementById("itemImage").value = item.image;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDescription").value = item.description;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemStatus").value = item.status;
    openMenuModal("Edit Menu Item");
}

async function deleteItem(id) {
    if (!confirm("Delete this menu item?")) return;

    try {
        await PubAPI.menu.remove(id);
    } catch (error) {
        alert(`Deleted only from this browser because the backend is unavailable. ${error.message}`);
    }

    menuItems = menuItems.filter(item => Number(item.id) !== Number(id));
    cacheMenu();
    renderMenu(menuItems);
}

document.getElementById("searchInput").addEventListener("input", event => {
    const value = event.target.value.toLowerCase();
    renderMenu(menuItems.filter(item => item.name.toLowerCase().includes(value)));
});

document.getElementById("categoryFilter").addEventListener("change", event => {
    const category = event.target.value;
    renderMenu(category === "All" ? menuItems : menuItems.filter(item => item.category === category));
});

loadMenu();
