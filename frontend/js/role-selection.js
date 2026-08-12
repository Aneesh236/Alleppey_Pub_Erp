"use strict";

/* Alleppey Pub ERP - portal role selection. */

let navigationInProgress = false;


function clearPreviousSession() {
    const sessionKeys = [
        "authToken",
        "loggedInUser",
        "displayName",
        "adminLoggedIn",
        "employeeLoggedIn",
        "isLoggedIn",
        "userRole",
        "authExpiresAt"
    ];

    sessionKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}


function openCustomerPortal() {
    clearPreviousSession();
    localStorage.setItem("selectedRole", "customer");
    localStorage.setItem("userRole", "customer");
    window.location.href = "customer-home.html";
}


function openStaffLogin(role) {
    clearPreviousSession();
    localStorage.setItem("selectedRole", role);
    window.location.href = `login.html?role=${encodeURIComponent(role)}`;
}


function selectRole(role) {
    if (navigationInProgress) return;

    navigationInProgress = true;

    if (role === "customer") {
        openCustomerPortal();
        return;
    }

    if (role === "employee" || role === "admin") {
        openStaffLogin(role);
        return;
    }

    navigationInProgress = false;
}


document.querySelectorAll(".role-card[data-role]").forEach((card) => {
    card.addEventListener("click", () => {
        selectRole(card.dataset.role);
    });

    card.addEventListener("keydown", (event) => {
        if (event.target.closest("button")) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectRole(card.dataset.role);
        }
    });
});


window.addEventListener("pageshow", () => {
    navigationInProgress = false;
});
