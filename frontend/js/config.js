/* Use the local backend during development and Render after deployment. */
const PUB_LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

window.PUB_API_BASE_URL = PUB_LOCAL_HOSTS.has(window.location.hostname)
    ? "http://127.0.0.1:8000/api"
    : "https://alleppey-pub-erp.onrender.com/api";
