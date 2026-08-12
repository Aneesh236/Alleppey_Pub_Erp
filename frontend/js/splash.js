/* =========================================
   ALLEPPEY PUB ERP - SPLASH SCREEN
========================================= */

const loadingPercent = document.getElementById("loadingPercent");
const loadingText = document.getElementById("loadingText");
const progressBar = document.getElementById("progressBar");

let progress = 0;

const loadingInterval = setInterval(() => {

    progress += 1;

    loadingPercent.textContent = `${progress}%`;

    progressBar.style.width = `${progress}%`;

    if (progress < 30) {

        loadingText.textContent = "Initializing system";

    } else if (progress < 60) {

        loadingText.textContent = "Loading ERP modules";

    } else if (progress < 85) {

        loadingText.textContent = "Preparing user interface";

    } else if (progress < 100) {

        loadingText.textContent = "Almost ready";

    } else {

        loadingText.textContent = "Ready";

        clearInterval(loadingInterval);

        setTimeout(() => {

            window.location.href = "../html/role-selection.html";

        }, 500);

    }

}, 30);