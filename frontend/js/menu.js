(() => {
    "use strict";

    const searchInput = document.getElementById("menuSearch");
    const filterButton = document.getElementById("filterBtn");
    const categorySection = document.querySelector(".category-section");
    const categoryButtons = [
        ...document.querySelectorAll(".menu-categories [data-category]")
    ];
    const menuCards = [...document.querySelectorAll(".menu-card")];
    const emptyState = document.getElementById("emptyMenuState");

    let activeCategory = "All";
    let searchTerm = "";

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function applyFilters() {
        let visibleCount = 0;

        menuCards.forEach(card => {
            const category = normalize(card.dataset.category);
            const searchableText = normalize(card.textContent);
            const categoryMatches =
                activeCategory === "All" ||
                category === normalize(activeCategory);
            const searchMatches =
                !searchTerm || searchableText.includes(normalize(searchTerm));
            const statusMatches = normalize(card.dataset.status) !== "hidden";
            const shouldShow = categoryMatches && searchMatches && statusMatches;

            card.hidden = !shouldShow;

            if (shouldShow) {
                visibleCount += 1;
            }
        });

        emptyState?.classList.toggle("show", visibleCount === 0);
    }

    function selectCategory(category, shouldScroll = false) {
        const matchingButton = categoryButtons.find(
            button => normalize(button.dataset.category) === normalize(category)
        );

        activeCategory = matchingButton?.dataset.category || "All";

        categoryButtons.forEach(button => {
            const isActive = button === matchingButton ||
                (!matchingButton && button.dataset.category === "All");

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        applyFilters();

        if (shouldScroll) {
            document.querySelector(".items-section")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    searchInput?.addEventListener("input", event => {
        searchTerm = event.target.value;
        applyFilters();
    });

    categoryButtons.forEach(button => {
        button.setAttribute(
            "aria-pressed",
            String(button.classList.contains("active"))
        );

        button.addEventListener("click", () => {
            selectCategory(button.dataset.category, true);
        });
    });

    filterButton?.addEventListener("click", () => {
        categorySection?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        const activeButton =
            categoryButtons.find(button => button.classList.contains("active")) ||
            categoryButtons[0];

        window.setTimeout(() => activeButton?.focus(), 450);
    });

    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    const shouldFocusSearch = params.get("focus") === "search";

    selectCategory(requestedCategory || "All");

    if (shouldFocusSearch && searchInput) {
        window.setTimeout(() => {
            searchInput.focus();
            searchInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 150);
    }
})();
