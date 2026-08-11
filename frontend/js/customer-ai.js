/* =========================================
   ALLEPPEY PUB ERP
   CUSTOMER AI CONCIERGE
========================================= */

const CUSTOMER_AI_URL = `${(
    window.PUB_API_BASE_URL ||
    "https://alleppey-pub-erp.onrender.com/api"
).replace(/\/$/, "")}/ai/customer`;

const customerAiMessages =
    document.getElementById(
        "customerAiMessages"
    );

const customerAiInput =
    document.getElementById(
        "customerAiInput"
    );

const customerAiSendBtn =
    document.getElementById(
        "customerAiSendBtn"
    );

const customerAiPrompts =
    document.querySelectorAll(
        ".customer-ai-prompt"
    );

function addCustomerAiMessage(
    message,
    sender
) {

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        `ai-message ${sender}-message`;

    bubble.textContent =
        message;

    customerAiMessages.appendChild(
        bubble
    );

    customerAiMessages.scrollTop =
        customerAiMessages.scrollHeight;

    return bubble;

}

function localCustomerAnswer(question) {

    const query =
        question.toLowerCase();

    if (
        query.includes("beer") ||
        query.includes("lager")
    ) {

        return "Try the Lager Beer (₹220). It is crisp and pairs well with Chicken Wings or the Pub Burger.";

    }

    if (
        query.includes("cocktail") ||
        query.includes("mojito") ||
        query.includes("margarita")
    ) {

        return "Choose the Mojito (₹280) for something fresh, or the Margarita (₹350) for a stronger citrus taste.";

    }

    if (
        query.includes("pair") ||
        query.includes("food")
    ) {

        return "Chicken Wings with Lager Beer is the best easy pairing. For a fuller meal, choose the Pub Burger.";

    }

    if (
        query.includes("special") ||
        query.includes("today")
    ) {

        return "Today’s picks are Grilled Chicken (₹380), Margarita (₹350), and Chicken Wings (₹320).";

    }

    return "Ask me about beer, cocktails, food pairings, prices, dietary choices, or today’s specials.";

}

async function askCustomerAi(question) {

    const cleanQuestion =
        question.trim();

    if (!cleanQuestion) {

        customerAiInput.focus();

        return;

    }

    addCustomerAiMessage(
        cleanQuestion,
        "user"
    );

    customerAiInput.value = "";
    customerAiInput.disabled = true;
    customerAiSendBtn.disabled = true;

    const typingMessage =
        addCustomerAiMessage(
            "Thinking…",
            "assistant"
        );

    typingMessage.classList.add(
        "ai-typing"
    );

    try {

        const response =
            await fetch(
                CUSTOMER_AI_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            question:
                                cleanQuestion
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "The AI assistant is unavailable."
            );

        }

        typingMessage.textContent =
            data.answer;

    } catch (error) {

        console.error(
            "Customer AI request failed:",
            error
        );

        typingMessage.textContent =
            localCustomerAnswer(
                cleanQuestion
            );

    } finally {

        typingMessage.classList.remove(
            "ai-typing"
        );

        customerAiInput.disabled = false;
        customerAiSendBtn.disabled = false;
        customerAiInput.focus();

    }

}

customerAiSendBtn.addEventListener(
    "click",
    () => {

        askCustomerAi(
            customerAiInput.value
        );

    }
);

customerAiInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            askCustomerAi(
                customerAiInput.value
            );

        }

    }
);

customerAiPrompts.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                askCustomerAi(
                    button.dataset.question ||
                    button.textContent
                );

            }
        );

    }
);
