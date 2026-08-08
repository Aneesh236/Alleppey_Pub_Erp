/* Shared REST client for the Alleppey Pub ERP. */
(() => {
    "use strict";

    const configuredUrl =
        window.PUB_API_BASE_URL ||
        localStorage.getItem("pubApiBaseUrl") ||
        "https://alleppey-pub-erp.onrender.com/api";

    const baseUrl = configuredUrl.replace(/\/$/, "");

    async function request(path, options = {}) {
        const controller = new AbortController();
        // Render may need a little time to respond after a period of inactivity.
        const timeout = window.setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(`${baseUrl}${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            });

            if (!response.ok) {
                let message = `Request failed (${response.status})`;
                try {
                    const error = await response.json();
                    message = error.detail || message;
                } catch (_) {
                    // Keep the status-based message for non-JSON responses.
                }
                throw new Error(message);
            }

            return response.status === 204 ? null : response.json();
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new Error("The server took too long to respond. Please try again.");
            }
            throw error;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    const jsonOptions = (method, data) => ({
        method,
        ...(data !== undefined && { body: JSON.stringify(data) })
    });

    window.PubAPI = {
        baseUrl,
        health: () => request("/health"),
        menu: {
            list: () => request("/menu"),
            create: item => request("/menu", jsonOptions("POST", item)),
            update: (id, item) => request(`/menu/${encodeURIComponent(id)}`, jsonOptions("PUT", item)),
            remove: id => request(`/menu/${encodeURIComponent(id)}`, { method: "DELETE" })
        },
        inventory: {
            list: () => request("/inventory"),
            create: item => request("/inventory", jsonOptions("POST", item)),
            update: (id, item) => request(`/inventory/${encodeURIComponent(id)}`, jsonOptions("PUT", item)),
            remove: id => request(`/inventory/${encodeURIComponent(id)}`, { method: "DELETE" })
        },
        orders: {
            list: () => request("/orders"),
            create: order => request("/orders", jsonOptions("POST", order)),
            updateStatus: (id, status) => request(
                `/orders/${encodeURIComponent(id)}/status`,
                jsonOptions("PATCH", { status })
            ),
            remove: id => request(`/orders/${encodeURIComponent(id)}`, { method: "DELETE" })
        }
    };
})();
