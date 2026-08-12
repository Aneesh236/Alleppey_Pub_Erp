/* Use the local backend during development and Render after deployment. */
const PUB_LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const PUB_USE_LOCAL_API =
    window.location.protocol === "file:" ||
    PUB_LOCAL_HOSTS.has(window.location.hostname);

window.PUB_API_BASE_URL = PUB_USE_LOCAL_API
    ? "http://127.0.0.1:8000/api"
    : "https://alleppey-pub-erp.onrender.com/api";
