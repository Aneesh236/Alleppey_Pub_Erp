/* =========================================
   ALLEPPEY PUB ERP - ROLE SELECTION
========================================= */

function customerLogin() {

    window.location.href =
        "../html/customer-home.html";

}


function employeeLogin() {

    localStorage.setItem(
        "selectedRole",
        "employee"
    );

    window.location.href =
        "../html/login.html";

}


function adminLogin() {

    localStorage.setItem(
        "selectedRole",
        "admin"
    );

    window.location.href =
        "../html/login.html";

}


/* Allow keyboard selection using Enter or Space */

function handleCardKey(event, callback) {

    if (
        event.key === "Enter" ||
        event.key === " "
    ) {

        event.preventDefault();

        callback();

    }

}


/* Stop button clicks from triggering twice */

document
    .querySelectorAll(".role-button")
    .forEach((button) => {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                const card =
                    event.currentTarget.closest(
                        ".role-card"
                    );

                if (
                    card.classList.contains(
                        "customer-card"
                    )
                ) {

                    customerLogin();

                } else if (
                    card.classList.contains(
                        "employee-card"
                    )
                ) {

                    employeeLogin();

                } else if (
                    card.classList.contains(
                        "admin-card"
                    )
                ) {

                    adminLogin();

                }

            }
        );

    });