/* =========================================
   ALLEPPEY PUB ERP
   AI BUSINESS ASSISTANT
========================================= */

const AI_API_URL =
    "http://127.0.0.1:8000/api/ai/analyse";

const AI_HEALTH_URL =
    "http://127.0.0.1:8000/health";

const ORDER_STORAGE_KEY =
    "pubOrders";

const BILL_STORAGE_KEY =
    "pubBills";

const INVENTORY_STORAGE_KEY =
    "pubInventory";


let orders = [];
let bills = [];
let inventoryItems = [];

let latestAnalysis = null;
let toastTimer;
let usingDemoData = false;

const DEMO_ORDERS = [
    {
        id: "ORD-101",
        customer: "Table 4",
        status: "Completed",
        orderType: "Dine In",
        items: [
            { name: "Lager Beer", price: 220, quantity: 3 },
            { name: "Chicken Wings", price: 320, quantity: 1 }
        ]
    },
    {
        id: "ORD-102",
        customer: "Table 7",
        status: "Preparing",
        orderType: "Dine In",
        items: [
            { name: "Mojito", price: 280, quantity: 2 },
            { name: "Pub Burger", price: 420, quantity: 2 }
        ]
    },
    {
        id: "ORD-103",
        customer: "Walk-in Customer",
        status: "Pending",
        orderType: "Take Away",
        items: [
            { name: "Lager Beer", price: 220, quantity: 2 },
            { name: "Chicken Wings", price: 320, quantity: 2 }
        ]
    }
];

const DEMO_BILLS = [
    {
        id: "BILL-101",
        orderId: "ORD-101",
        total: 980,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        items: DEMO_ORDERS[0].items
    },
    {
        id: "BILL-102",
        orderId: "ORD-102",
        total: 1400,
        paymentMethod: "Card",
        paymentStatus: "Paid",
        items: DEMO_ORDERS[1].items
    }
];

const DEMO_INVENTORY = [
    { name: "Lager Beer", currentStock: 4, minimumStock: 5, unit: "bottles" },
    { name: "Mojito Mix", currentStock: 12, minimumStock: 8, unit: "servings" },
    { name: "Chicken Wings", currentStock: 3, minimumStock: 6, unit: "portions" }
];


/* =========================================
   ELEMENTS
========================================= */

const apiStatus =
    document.getElementById("apiStatus");

const refreshDataBtn =
    document.getElementById("refreshDataBtn");

const ordersLoaded =
    document.getElementById("ordersLoaded");

const billsLoaded =
    document.getElementById("billsLoaded");

const inventoryLoaded =
    document.getElementById("inventoryLoaded");

const loadedRevenue =
    document.getElementById("loadedRevenue");


const aiQuestion =
    document.getElementById("aiQuestion");

const questionLength =
    document.getElementById("questionLength");

const analyseBusinessBtn =
    document.getElementById("analyseBusinessBtn");

const clearQuestionBtn =
    document.getElementById("clearQuestionBtn");

const suggestionButtons =
    document.querySelectorAll(".suggestion-btn");


const resultPlaceholder =
    document.getElementById("resultPlaceholder");

const analysisLoading =
    document.getElementById("analysisLoading");

const loadingMessage =
    document.getElementById("loadingMessage");

const analysisResults =
    document.getElementById("analysisResults");


const aiSummary =
    document.getElementById("aiSummary");

const aiAnswer =
    document.getElementById("aiAnswer");

const salesInsightsList =
    document.getElementById("salesInsightsList");

const inventoryAlertsList =
    document.getElementById("inventoryAlertsList");

const recommendationsList =
    document.getElementById("recommendationsList");

const copyResultBtn =
    document.getElementById("copyResultBtn");


const quickCards =
    document.querySelectorAll(".quick-card");


const errorModal =
    document.getElementById("errorModal");

const errorMessage =
    document.getElementById("errorMessage");

const closeErrorModalBtn =
    document.getElementById("closeErrorModal");

const toast =
    document.getElementById("toast");


/* =========================================
   LOAD LOCAL STORAGE DATA
========================================= */

function loadBusinessData() {

    try {

        const storedOrders =
            getStoredArray(
                ORDER_STORAGE_KEY,
                "orderHistory"
            );

        const storedBills =
            getStoredArray(
                BILL_STORAGE_KEY,
                "billHistory"
            );

        const storedInventory =
            getStoredArray(
                INVENTORY_STORAGE_KEY,
                "inventoryItems"
            );

        usingDemoData =
            !storedOrders.length &&
            !storedBills.length &&
            !storedInventory.length;

        orders =
            storedOrders.length
                ? storedOrders
                : DEMO_ORDERS;

        bills =
            storedBills.length
                ? storedBills
                : (
                    storedOrders.length
                        ? createBillsFromOrders(
                            storedOrders
                        )
                        : DEMO_BILLS
                );

        inventoryItems =
            storedInventory.length
                ? storedInventory
                : DEMO_INVENTORY;


        updateDataSummary();

        if (usingDemoData) {

            showToast(
                "Demo business data loaded. Add orders to analyse live data.",
                "success"
            );

        }

    } catch (error) {

        console.error(
            "Unable to load local business data:",
            error
        );

        orders = [];
        bills = [];
        inventoryItems = [];

        updateDataSummary();

        showToast(
            "Some business data could not be loaded.",
            "error"
        );

    }

}

function getStoredArray(...keys) {

    for (const key of keys) {

        const value =
            localStorage.getItem(
                key
            );

        if (!value) {

            continue;

        }

        try {

            const parsed =
                JSON.parse(
                    value
                );

            if (
                Array.isArray(parsed) &&
                parsed.length
            ) {

                return parsed;

            }

        } catch (error) {

            console.warn(
                `Unable to read ${key}:`,
                error
            );

        }

    }

    return [];

}

function createBillsFromOrders(orderList) {

    return orderList
        .filter(order => {

            const status =
                String(
                    order.paymentStatus ||
                    order.status ||
                    ""
                ).toLowerCase();

            return (
                status.includes("paid") ||
                status.includes("complete") ||
                status.includes("deliver")
            );

        })
        .map(order => {

            const calculatedTotal =
                normalizeItems(
                    order.items
                )
                    .reduce(
                        (total, item) => {

                            return (
                                total +
                                item.price *
                                item.quantity
                            );

                        },
                        0
                    );

            return {
                id: `AUTO-${order.id || order.orderId || "BILL"}`,
                orderId: order.id || order.orderId,
                total:
                    Number(
                        order.total ||
                        order.grandTotal ||
                        calculatedTotal
                    ),
                paymentMethod:
                    order.paymentMethod ||
                    "Unspecified",
                paymentStatus: "Paid",
                items: order.items || []
            };

        });

}


/* =========================================
   UPDATE DATA SUMMARY
========================================= */

function updateDataSummary() {

    const revenue =
        bills
            .filter(bill => {

                return getBillPaymentStatus(
                    bill
                ).toLowerCase() ===
                "paid";

            })
            .reduce(
                (total, bill) => {

                    return (
                        total +
                        Number(
                            bill.total ||
                            bill.grandTotal ||
                            0
                        )
                    );

                },
                0
            );


    ordersLoaded.textContent =
        orders.length;

    billsLoaded.textContent =
        bills.length;

    inventoryLoaded.textContent =
        inventoryItems.length;

    loadedRevenue.textContent =
        formatMoney(revenue);

}


/* =========================================
   CHECK API STATUS
========================================= */

async function checkApiStatus() {

    apiStatus.classList.remove(
        "online",
        "offline"
    );

    apiStatus.innerHTML = `

        <span class="status-dot"></span>

        Checking AI

    `;


    try {

        const response =
            await fetch(
                AI_HEALTH_URL,
                {
                    method: "GET"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Health check failed: ${response.status}`
            );

        }


        apiStatus.classList.add(
            "online"
        );

        apiStatus.innerHTML = `

            <span class="status-dot"></span>

            AI Online

        `;

    } catch (error) {

        console.error(
            "AI backend health check failed:",
            error
        );


        apiStatus.classList.add(
            "offline"
        );

        apiStatus.innerHTML = `

            <span class="status-dot"></span>

            AI Offline

        `;

    }

}


/* =========================================
   PREPARE API DATA
========================================= */

function createAnalyticsRequest(question) {

    return {

        orders:
            orders.map(order => {

                return {

                    id:
                        String(
                            order.id ||
                            order.orderId ||
                            "ORD-UNKNOWN"
                        ),

                    customer:
                        String(
                            order.customer ||
                            order.customerName ||
                            "Walk-in Customer"
                        ),

                    status:
                        String(
                            order.status ||
                            "Pending"
                        ),

                    order_type:
                        String(
                            order.orderType ||
                            order.type ||
                            "Dine In"
                        ),

                    items:
                        normalizeItems(
                            order.items
                        )

                };

            }),


        bills:
            bills.map(bill => {

                return {

                    id:
                        String(
                            bill.id ||
                            bill.billId ||
                            "BILL-UNKNOWN"
                        ),

                    order_id:
                        String(
                            bill.orderId ||
                            bill.order_id ||
                            "Manual"
                        ),

                    customer:
                        String(
                            bill.customer ||
                            bill.customerName ||
                            "Walk-in Customer"
                        ),

                    total:
                        Number(
                            bill.total ||
                            bill.grandTotal ||
                            0
                        ),

                    payment_method:
                        String(
                            bill.paymentMethod ||
                            bill.payment_method ||
                            "Cash"
                        ),

                    payment_status:
                        getBillPaymentStatus(
                            bill
                        ),

                    items:
                        normalizeItems(
                            bill.items
                        )

                };

            }),


        inventory:
            inventoryItems.map(item => {

                return {

                    name:
                        String(
                            item.name ||
                            item.itemName ||
                            "Inventory Item"
                        ),

                    current_stock:
                        Number(
                            item.currentStock ??
                            item.current_stock ??
                            0
                        ),

                    minimum_stock:
                        Number(
                            item.minimumStock ??
                            item.minimum_stock ??
                            0
                        ),

                    unit:
                        String(
                            item.unit ||
                            "Unit"
                        )

                };

            }),


        question:
            question

    };

}


/* =========================================
   NORMALIZE ITEMS
========================================= */

function normalizeItems(items) {

    if (!Array.isArray(items)) {

        return [];

    }


    return items.map(item => {

        return {

            name:
                String(
                    item.name ||
                    item.itemName ||
                    "Item"
                ),

            price:
                Number(
                    item.price ||
                    0
                ),

            quantity:
                Math.max(
                    1,
                    Number(
                        item.quantity ||
                        item.qty ||
                        1
                    )
                )

        };

    });

}


/* =========================================
   GET PAYMENT STATUS
========================================= */

function getBillPaymentStatus(bill) {

    return String(
        bill.paymentStatus ||
        bill.payment_status ||
        bill.status ||
        "Pending"
    );

}


/* =========================================
   ANALYSE BUSINESS
========================================= */

async function analyseBusiness() {

    const question =
        aiQuestion.value
            .trim();


    if (!question) {

        showToast(
            "Enter a business question first.",
            "error"
        );

        aiQuestion.focus();

        return;

    }


    if (question.length > 500) {

        showToast(
            "The question must be 500 characters or fewer.",
            "error"
        );

        return;

    }


    setLoadingState(true);


    const loadingMessages = [

        "Reviewing sales and inventory records...",

        "Identifying business trends...",

        "Checking low-stock inventory...",

        "Preparing practical recommendations..."

    ];


    let messageIndex = 0;


    const loadingInterval =
        setInterval(() => {

            messageIndex =
                (
                    messageIndex + 1
                ) %
                loadingMessages.length;


            loadingMessage.textContent =
                loadingMessages[
                    messageIndex
                ];

        }, 1500);


    try {

        const requestData =
            createAnalyticsRequest(
                question
            );


        const response =
            await fetch(
                AI_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestData
                        )
                }
            );


        let responseData;


        try {

            responseData =
                await response.json();

        } catch (error) {

            responseData = null;

        }


        if (!response.ok) {

            const detail =
                responseData?.detail ||
                `Server returned status ${response.status}.`;


            throw new Error(detail);

        }


        latestAnalysis =
            validateAnalysisResponse(
                responseData
            );


        displayAnalysis(
            latestAnalysis
        );


        showToast(
            "AI analysis completed successfully.",
            "success"
        );


        checkApiStatus();

    } catch (error) {

        console.error(
            "AI analysis request failed:",
            error
        );


        showAnalysisError(
            error.message ||
            "Unable to connect to the AI service."
        );

    } finally {

        clearInterval(
            loadingInterval
        );

        setLoadingState(false);

    }

}


/* =========================================
   VALIDATE RESPONSE
========================================= */

function validateAnalysisResponse(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "The AI returned an invalid response."
        );

    }


    return {

        summary:
            String(
                data.summary ||
                "No summary was returned."
            ),

        sales_insights:
            Array.isArray(
                data.sales_insights
            )
                ? data.sales_insights
                : [],

        inventory_alerts:
            Array.isArray(
                data.inventory_alerts
            )
                ? data.inventory_alerts
                : [],

        recommendations:
            Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : [],

        answer:
            String(
                data.answer ||
                "No direct answer was returned."
            )

    };

}


/* =========================================
   DISPLAY ANALYSIS
========================================= */

function displayAnalysis(data) {

    resultPlaceholder.style.display =
        "none";

    analysisLoading.classList.remove(
        "show"
    );

    analysisResults.classList.add(
        "show"
    );


    aiSummary.textContent =
        data.summary;

    aiAnswer.textContent =
        data.answer;


    renderResultList(
        salesInsightsList,
        data.sales_insights,
        "No sales insights were generated."
    );


    renderResultList(
        inventoryAlertsList,
        data.inventory_alerts,
        "No urgent inventory alerts were found."
    );


    renderResultList(
        recommendationsList,
        data.recommendations,
        "No recommendations were generated."
    );

}


/* =========================================
   RENDER RESULT LIST
========================================= */

function renderResultList(
    container,
    items,
    emptyMessage
) {

    container.innerHTML = "";


    const values =
        items.length > 0
            ? items
            : [emptyMessage];


    values.forEach(item => {

        const listItem =
            document.createElement("li");


        const icon =
            document.createElement("i");


        icon.className =
            "fa-solid fa-circle-check";


        const text =
            document.createElement("span");


        text.textContent =
            String(item);


        listItem.appendChild(icon);

        listItem.appendChild(text);

        container.appendChild(
            listItem
        );

    });

}


/* =========================================
   LOADING STATE
========================================= */

function setLoadingState(isLoading) {

    analyseBusinessBtn.disabled =
        isLoading;

    analyseBusinessBtn.classList.toggle(
        "loading",
        isLoading
    );


    if (isLoading) {

        resultPlaceholder.style.display =
            "none";

        analysisResults.classList.remove(
            "show"
        );

        analysisLoading.classList.add(
            "show"
        );

    } else {

        analysisLoading.classList.remove(
            "show"
        );


        if (!latestAnalysis) {

            resultPlaceholder.style.display =
                "flex";

        }

    }

}


/* =========================================
   ERROR MODAL
========================================= */

function showAnalysisError(message) {

    errorMessage.textContent =
        message;

    errorModal.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";


    apiStatus.classList.remove(
        "online"
    );

    apiStatus.classList.add(
        "offline"
    );

    apiStatus.innerHTML = `

        <span class="status-dot"></span>

        AI Offline

    `;

}


function closeErrorModal() {

    errorModal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";

}


/* =========================================
   QUESTION EVENTS
========================================= */

aiQuestion.addEventListener(
    "input",
    function () {

        if (
            aiQuestion.value.length >
            500
        ) {

            aiQuestion.value =
                aiQuestion.value.slice(
                    0,
                    500
                );

        }


        questionLength.textContent =
            `${aiQuestion.value.length} / 500`;

    }
);


analyseBusinessBtn.addEventListener(
    "click",
    analyseBusiness
);


clearQuestionBtn.addEventListener(
    "click",
    function () {

        aiQuestion.value = "";

        questionLength.textContent =
            "0 / 500";

        aiQuestion.focus();

    }
);


/* =========================================
   SUGGESTION QUESTIONS
========================================= */

suggestionButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            aiQuestion.value =
                button.textContent.trim();

            questionLength.textContent =
                `${aiQuestion.value.length} / 500`;

            aiQuestion.focus();

        }
    );

});


/* =========================================
   QUICK ANALYSIS
========================================= */

quickCards.forEach(card => {

    card.addEventListener(
        "click",
        function () {

            const question =
                card.dataset.question;


            if (!question) {

                return;

            }


            aiQuestion.value =
                question;

            questionLength.textContent =
                `${question.length} / 500`;


            window.scrollTo({
                top:
                    document
                        .querySelector(
                            ".ai-workspace"
                        )
                        .offsetTop -
                    120,

                behavior:
                    "smooth"
            });


            setTimeout(
                analyseBusiness,
                350
            );

        }
    );

});


/* =========================================
   REFRESH DATA
========================================= */

refreshDataBtn.addEventListener(
    "click",
    function () {

        const icon =
            refreshDataBtn
                .querySelector("i");


        icon.classList.add(
            "fa-spin"
        );


        loadBusinessData();

        checkApiStatus();


        setTimeout(() => {

            icon.classList.remove(
                "fa-spin"
            );

        }, 700);


        showToast(
            "Business data refreshed.",
            "success"
        );

    }
);


/* =========================================
   COPY RESULT
========================================= */

copyResultBtn.addEventListener(
    "click",
    async function () {

        if (!latestAnalysis) {

            showToast(
                "Generate an analysis first.",
                "error"
            );

            return;

        }


        const copyText = `

ALLEPPEY PUB ERP - AI BUSINESS ANALYSIS

SUMMARY
${latestAnalysis.summary}

ANSWER
${latestAnalysis.answer}

SALES INSIGHTS
${latestAnalysis.sales_insights
    .map(
        (
            item,
            index
        ) =>
            `${index + 1}. ${item}`
    )
    .join("\n")}

INVENTORY ALERTS
${latestAnalysis.inventory_alerts
    .map(
        (
            item,
            index
        ) =>
            `${index + 1}. ${item}`
    )
    .join("\n")}

RECOMMENDATIONS
${latestAnalysis.recommendations
    .map(
        (
            item,
            index
        ) =>
            `${index + 1}. ${item}`
    )
    .join("\n")}

        `.trim();


        try {

            await navigator.clipboard.writeText(
                copyText
            );


            showToast(
                "AI analysis copied.",
                "success"
            );

        } catch (error) {

            console.error(
                "Clipboard error:",
                error
            );


            fallbackCopyText(
                copyText
            );

        }

    }
);


/* =========================================
   FALLBACK COPY
========================================= */

function fallbackCopyText(text) {

    const textArea =
        document.createElement(
            "textarea"
        );


    textArea.value = text;

    textArea.style.position =
        "fixed";

    textArea.style.opacity =
        "0";


    document.body.appendChild(
        textArea
    );


    textArea.select();


    try {

        document.execCommand(
            "copy"
        );


        showToast(
            "AI analysis copied.",
            "success"
        );

    } catch (error) {

        showToast(
            "Unable to copy analysis.",
            "error"
        );

    }


    textArea.remove();

}


/* =========================================
   MODAL EVENTS
========================================= */

closeErrorModalBtn.addEventListener(
    "click",
    closeErrorModal
);


errorModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            errorModal
        ) {

            closeErrorModal();

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeErrorModal();

        }


        if (
            event.key === "Enter" &&
            event.ctrlKey
        ) {

            analyseBusiness();

        }

    }
);


/* =========================================
   HELPERS
========================================= */

function formatMoney(value) {

    return Number(
        value ||
        0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =========================================
   TOAST
========================================= */

function showToast(
    message,
    type = ""
) {

    toast.textContent =
        message;


    toast.classList.remove(
        "show",
        "success",
        "error"
    );


    if (type) {

        toast.classList.add(
            type
        );

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2700);

}


/* =========================================
   INITIALIZE
========================================= */

function initializeAIAssistant() {

    loadBusinessData();

    checkApiStatus();

}


initializeAIAssistant();
