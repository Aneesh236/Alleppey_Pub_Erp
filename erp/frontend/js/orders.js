/*=========================================
    ORDERS.JS
    PART 1
=========================================*/

let orders = JSON.parse(
    localStorage.getItem("orderHistory")
) || [];

const tableBody =
document.getElementById("ordersBody");

/*=========================================
    LOAD ORDERS
=========================================*/

function loadOrders(data = orders){

    tableBody.innerHTML = "";

    if(data.length === 0){

        tableBody.innerHTML = `

        <tr>

            <td colspan="7">

                <div class="empty-orders">

                    <i class="fa-solid fa-box-open"></i>

                    <h3>No Orders Found</h3>

                    <p>No customer orders available.</p>

                </div>

            </td>

        </tr>

        `;

        updateStatistics([]);

        return;

    }

    data.forEach((order,index)=>{

        const row = document.createElement("tr");

        row.innerHTML = `

        <td>${order.orderId}</td>

        <td>${order.customer || "Walk-in"}</td>

        <td>${order.table || "-"}</td>

        <td>${order.items.length}</td>

        <td>${order.total}</td>

        <td>

            <span class="status ${order.status.toLowerCase()}">

                ${order.status}

            </span>

        </td>

        <td>

            <div class="actions">

                <button
                    class="view-btn"
                    onclick="viewOrder(${index})">

                    <i class="fa-solid fa-eye"></i>

                </button>

                <button
                    class="print-btn"
                    onclick="printOrder(${index})">

                    <i class="fa-solid fa-print"></i>

                </button>

                <button
                    class="delete-btn"
                    onclick="deleteOrder(${index})">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        </td>

        `;

        tableBody.appendChild(row);

    });

    updateStatistics(data);

}

/*=========================================
    UPDATE CARDS
=========================================*/

function updateStatistics(data){

    document.getElementById("totalOrders").textContent =
    data.length;

    document.getElementById("pendingOrders").textContent =
    data.filter(order=>order.status==="Pending").length;

    document.getElementById("completedOrders").textContent =
    data.filter(order=>order.status==="Completed").length;

    let revenue = 0;

    data.forEach(order=>{

        revenue += Number(

            order.total.replace(/[^\d]/g,"")

        );

    });

    document.getElementById("revenue").textContent =
    "₹"+revenue.toLocaleString();

}

/*=========================================
    ORDERS.JS
    PART 2
=========================================*/

/*=========================================
    SEARCH ORDERS
=========================================*/

const searchInput =
document.getElementById("searchOrder");

if(searchInput){

    searchInput.addEventListener("keyup", function(){

        const keyword =
        this.value.toLowerCase();

        const filtered = orders.filter(order =>

            order.orderId
                .toString()
                .toLowerCase()
                .includes(keyword)

            ||

            (order.customer || "")
                .toLowerCase()
                .includes(keyword)

        );

        loadOrders(filtered);

    });

}

/*=========================================
    FILTER STATUS
=========================================*/

const statusFilter =
document.getElementById("statusFilter");

if(statusFilter){

    statusFilter.addEventListener("change", function(){

        const status = this.value;

        if(status === "all"){

            loadOrders();

            return;

        }

        const filtered = orders.filter(order =>

            order.status === status

        );

        loadOrders(filtered);

    });

}

/*=========================================
    VIEW ORDER
=========================================*/

function viewOrder(index){

    const order = orders[index];

    let items = "";

    order.items.forEach(item=>{

        items +=

`${item.name}
Qty : ${item.quantity}
Price : ₹${item.price}

`;

    });

    alert(

`Order ID : ${order.orderId}

Customer : ${order.customer || "Walk-in"}

Table : ${order.table || "-"}

Status : ${order.status}

----------------------------

${items}

----------------------------

Total : ${order.total}`

    );

}

/*=========================================
    PRINT ORDER
=========================================*/

function printOrder(index){

    const order = orders[index];

    const receipt = window.open("", "",

    "width=400,height=700");

    receipt.document.write(`

    <html>

    <head>

    <title>Receipt</title>

    <style>

    body{

        font-family:Arial;

        padding:20px;

    }

    h2{

        text-align:center;

    }

    table{

        width:100%;

        border-collapse:collapse;

    }

    td{

        padding:6px 0;

    }

    </style>

    </head>

    <body>

    <h2>ALLEPPEY PUB & BAR</h2>

    <hr>

    <p><strong>Order :</strong>
    ${order.orderId}</p>

    <p><strong>Customer :</strong>
    ${order.customer || "Walk-in"}</p>

    <hr>

    <table>

    ${order.items.map(item=>`

        <tr>

            <td>

                ${item.name}

                x ${item.quantity}

            </td>

            <td align="right">

                ₹${item.price}

            </td>

        </tr>

    `).join("")}

    </table>

    <hr>

    <h3>Total : ${order.total}</h3>

    </body>

    </html>

    `);

    receipt.document.close();

    receipt.print();

}

/*=========================================
    ORDERS.JS
    PART 3
=========================================*/

/*=========================================
    DELETE ORDER
=========================================*/

function deleteOrder(index){

    const confirmDelete = confirm(
        "Are you sure you want to delete this order?"
    );

    if(!confirmDelete) return;

    orders.splice(index,1);

    localStorage.setItem(
        "orderHistory",
        JSON.stringify(orders)
    );

    loadOrders();

}

/*=========================================
    SAVE ORDER
=========================================*/

function saveOrders(){

    localStorage.setItem(

        "orderHistory",

        JSON.stringify(orders)

    );

}

/*=========================================
    REFRESH DASHBOARD
=========================================*/

function refreshDashboard(){

    loadOrders();

}

/*=========================================
    AUTO REFRESH
=========================================*/

setInterval(()=>{

    orders = JSON.parse(

        localStorage.getItem("orderHistory")

    ) || [];

    loadOrders();

},5000);

/*=========================================
    DEMO DATA
    (Only if there are no orders)
=========================================*/

if(orders.length === 0){

    orders = [

        {

            orderId:"#1001",

            customer:"John",

            table:"05",

            items:[

                {

                    name:"Lager Beer",

                    quantity:2,

                    price:250

                },

                {

                    name:"Chicken Wings",

                    quantity:1,

                    price:320

                }

            ],

            total:"₹820",

            status:"Completed"

        },

        {

            orderId:"#1002",

            customer:"Rahul",

            table:"03",

            items:[

                {

                    name:"Pub Burger",

                    quantity:1,

                    price:450

                }

            ],

            total:"₹450",

            status:"Pending"

        },

        {

            orderId:"#1003",

            customer:"Anu",

            table:"08",

            items:[

                {

                    name:"Mojito",

                    quantity:2,

                    price:280

                }

            ],

            total:"₹560",

            status:"Preparing"

        }

    ];

    saveOrders();

}

/*=========================================
    PAGE LOAD
=========================================*/

window.addEventListener("load",()=>{

    loadOrders();

});