// ✅ Load menu from localStorage OR fallback

  const menuItems = [
    { id: 1, name: "Lager Beer", price: 6.00, type: "drink", icon: "🍺" },
    { id: 2, name: "Margarita", price: 8.00, type: "drink", icon: "🍸" },
    { id: 3, name: "Mojito", price: 7.50, type: "drink", icon: "🍹" },
    { id: 4, name: "Red Wine", price: 7.00, type: "drink", icon: "🍷" },
    { id: 5, name: "Pub Burger", price: 10.00, type: "food", icon: "🍔" },
    { id: 6, name: "Buffalo Wings", price: 9.00, type: "food", icon: "🍗" },
    { id: 7, name: "French Fries", price: 4.00, type: "food", icon: "🍟" }
  ];


// ✅ Global order state
let order = {};

// ✅ Wait for DOM
document.addEventListener("DOMContentLoaded", () => {

  // DOM Elements
  const menuContainer = document.getElementById('menuContainer');
  const orderList = document.getElementById('orderList');
  const totalAmount = document.getElementById('totalAmount');
  const printBtn = document.getElementById('printBtn');

  // 🔹 Render Menu
  function renderMenu(type = "all") {
    menuContainer.innerHTML = "";

    const filtered = type === "all"
      ? menuItems
      : menuItems.filter(item => item.type === type);

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";

      card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">£${item.price.toFixed(2)}</div>
      `;

      card.onclick = () => addItemToOrder(item);

      menuContainer.appendChild(card);
    });
  }

  // 🔹 Filter
  window.filterMenu = function(type, event) {
    renderMenu(type);
    document.querySelectorAll(".filters button").forEach(btn => btn.classList.remove("active"));
    if (event) event.target.classList.add("active");
  };

  // 🔹 Add Item
  function addItemToOrder(item) {
    if (order[item.id]) {
      order[item.id].qty++;
    } else {
      order[item.id] = { ...item, qty: 1 };
    }
    renderOrder();
  }

  // 🔹 Change Quantity
  function changeQty(id, delta) {
    if (!order[id]) return;

    order[id].qty += delta;

    if (order[id].qty <= 0) delete order[id];

    renderOrder();
  }

  // 🔹 Render Order
  function renderOrder() {
    orderList.innerHTML = "";
    const items = Object.values(order);

    if (!items.length) {
      orderList.innerHTML = "<p>No items added yet.</p>";
      totalAmount.textContent = "Total: £0.00";
      printBtn.disabled = true;
      return;
    }

    let total = 0;

    items.forEach(item => {
      total += item.price * item.qty;

      const div = document.createElement("div");
      div.className = "order-item";

      div.innerHTML = `
        <div class="name">${item.name}</div>
        <div class="qty-control">
          <button class="qty-btn">−</button>
          <div class="qty">${item.qty}</div>
          <button class="qty-btn">+</button>
        </div>
        <div class="price">£${(item.price * item.qty).toFixed(2)}</div>
      `;

      const btns = div.querySelectorAll(".qty-btn");
      btns[0].onclick = () => changeQty(item.id, -1);
      btns[1].onclick = () => changeQty(item.id, +1);

      orderList.appendChild(div);
    });

    totalAmount.textContent = `Total: £${total.toFixed(2)}`;
    printBtn.disabled = false;
  }

  // 🔹 Print + AI + Save
  printBtn.addEventListener("click", async () => {

    if (Object.keys(order).length === 0) {
      alert("No items in the bill!");
      return;
    }

    let total = 0;
    let orderData = [];

    Object.values(order).forEach(item => {
      total += item.price * item.qty;

      orderData.push({
        name: item.name,
        qty: item.qty,
        price: item.price
      });
    });

    let receipt = "🍻 Receipt 🍻\n\n";

    orderData.forEach(item => {
      receipt += `${item.name} x${item.qty} - £${(item.price * item.qty).toFixed(2)}\n`;
    });

    receipt += `\nTotal: £${total.toFixed(2)}\n\n`;

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orders: orderData })
      });

      const result = await response.json();

      receipt += "🤖 AI Insight:\n" + result.insight;

    } catch (error) {
      console.error(error);
      receipt += "⚠️ AI unavailable";
    }

    alert(receipt);

    // ✅ Save history
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.push({
      items: orderData,
      total: total,
      date: new Date().toISOString()
    });

    localStorage.setItem("orders", JSON.stringify(orders));

    // 🔄 Reset
    order = {};
    renderOrder();
    renderMenu();
  });

  // ✅ Initial load
  renderMenu();
  renderOrder();

});