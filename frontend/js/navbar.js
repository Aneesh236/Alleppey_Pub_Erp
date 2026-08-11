(() => {
    "use strict";

    const CART_STORAGE_KEY = "cart";
    const RESERVATION_STORAGE_KEY = "reservations";

    const featuredProducts = {
        lager: {
            id: 1,
            title: "Lager Beer",
            subtitle: "Premium Imported Beer",
            image: "../img/lager.jpeg",
            price: 220,
            category: "Beer"
        },
        mojito: {
            id: 2,
            title: "Mojito",
            subtitle: "Refreshing Cocktail",
            image: "../img/mojito.jpeg",
            price: 350,
            category: "Cocktails"
        },
        burger: {
            id: 3,
            title: "Pub Burger",
            subtitle: "Signature Burger",
            image: "../img/burger.jpeg",
            price: 420,
            category: "Food"
        }
    };

    const navLinks = [...document.querySelectorAll(".nav-links a")];
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("customerNavLinks");
    const cartCount = document.getElementById("navbarCartCount");
    const cartTotal = document.getElementById("navbarCartTotal");
    const toast = document.getElementById("homeToast");
    const reservationForm = document.getElementById("reservationForm");
    const reservationDate = document.getElementById("reservationDate");

    function safelyReadArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.error(`Unable to read ${key}:`, error);
            return [];
        }
    }

    function updateNavbarCart() {
        const cart = safelyReadArray(CART_STORAGE_KEY);

        const summary = cart.reduce(
            (result, item) => {
                const quantity = Math.max(1, Number(item.quantity ?? item.qty) || 1);
                const price = Number(item.price) || 0;

                result.quantity += quantity;
                result.total += price * quantity;
                return result;
            },
            { quantity: 0, total: 0 }
        );

        if (cartCount) {
            cartCount.textContent = String(summary.quantity);
        }

        if (cartTotal) {
            cartTotal.textContent = `₹${summary.total.toLocaleString("en-IN")}`;
        }
    }

    function showToast(message) {
        if (!toast) {
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.clearTimeout(showToast.timeoutId);
        showToast.timeoutId = window.setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
    }

    function addFeaturedProduct(productKey) {
        const product = featuredProducts[productKey];

        if (!product) {
            return;
        }

        const cart = safelyReadArray(CART_STORAGE_KEY);
        const existingProduct = cart.find(
            item => String(item.id) === String(product.id)
        );

        if (existingProduct) {
            existingProduct.quantity =
                Math.max(1, Number(existingProduct.quantity ?? existingProduct.qty) || 1) + 1;
            delete existingProduct.qty;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateNavbarCart();
        showToast(`${product.title} added to your cart.`);
    }

    function closeMobileMenu() {
        if (!mobileMenu || !mobileMenuBtn) {
            return;
        }

        mobileMenu.classList.remove("open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.setAttribute("aria-label", "Open navigation menu");
        mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }

    function toggleMobileMenu() {
        if (!mobileMenu || !mobileMenuBtn) {
            return;
        }

        const willOpen = !mobileMenu.classList.contains("open");

        mobileMenu.classList.toggle("open", willOpen);
        mobileMenuBtn.setAttribute("aria-expanded", String(willOpen));
        mobileMenuBtn.setAttribute(
            "aria-label",
            willOpen ? "Close navigation menu" : "Open navigation menu"
        );
        mobileMenuBtn.innerHTML = willOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    }

    function setActiveLink(sectionId) {
        navLinks.forEach(link => {
            const target = link.getAttribute("href");
            const isActive = target === `#${sectionId}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function initializeSectionTracking() {
        const sections = navLinks
            .map(link => link.getAttribute("href"))
            .filter(href => href && href.startsWith("#"))
            .map(href => document.querySelector(href))
            .filter(Boolean);

        if (!("IntersectionObserver" in window) || sections.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                const visibleEntry = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visibleEntry) {
                    setActiveLink(visibleEntry.target.id);
                }
            },
            {
                rootMargin: "-22% 0px -62% 0px",
                threshold: [0.05, 0.2, 0.4]
            }
        );

        sections.forEach(section => observer.observe(section));
    }

    function saveReservation(event) {
        event.preventDefault();

        if (!reservationForm || !reservationForm.checkValidity()) {
            reservationForm?.reportValidity();
            return;
        }

        const formData = new FormData(reservationForm);
        const reservations = safelyReadArray(RESERVATION_STORAGE_KEY);
        const reservation = {
            id: `RES-${Date.now()}`,
            name: String(formData.get("name") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            date: formData.get("date"),
            time: formData.get("time"),
            guests: Number(formData.get("guests")) || 1,
            occasion: formData.get("occasion") || "Regular visit",
            status: "Pending",
            createdAt: new Date().toISOString()
        };

        reservations.push(reservation);
        localStorage.setItem(
            RESERVATION_STORAGE_KEY,
            JSON.stringify(reservations)
        );

        reservationForm.reset();
        setMinimumReservationDate();
        showToast(`Reservation request ${reservation.id} saved.`);
    }

    function setMinimumReservationDate() {
        if (!reservationDate) {
            return;
        }

        const today = new Date();
        const localDate = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        )
            .toISOString()
            .split("T")[0];

        reservationDate.min = localDate;
    }

    mobileMenuBtn?.addEventListener("click", toggleMobileMenu);

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (link.getAttribute("href")?.startsWith("#")) {
                setActiveLink(link.getAttribute("href").slice(1));
            }
            closeMobileMenu();
        });
    });

    document.addEventListener("click", event => {
        if (
            mobileMenu?.classList.contains("open") &&
            !event.target.closest(".customer-nav")
        ) {
            closeMobileMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1250) {
            closeMobileMenu();
        }
    });

    window.addEventListener("storage", event => {
        if (event.key === CART_STORAGE_KEY) {
            updateNavbarCart();
        }
    });

    document.querySelectorAll(".home-add-btn").forEach(button => {
        button.addEventListener("click", () => {
            addFeaturedProduct(button.dataset.product);
        });
    });

    reservationForm?.addEventListener("submit", saveReservation);

    setMinimumReservationDate();
    updateNavbarCart();
    initializeSectionTracking();
})();
