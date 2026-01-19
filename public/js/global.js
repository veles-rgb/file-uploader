(function () {
    const overlay = document.getElementById("loading-overlay");

    if (!overlay) return;

    function showLoading() {
        overlay.classList.remove("hidden");
        document.querySelectorAll("button, input[type=submit]").forEach(btn => {
            btn.disabled = true;
        });
    }

    // Show loader on form submit
    document.addEventListener("submit", (e) => {
        if (e.target.tagName === "FORM") {
            showLoading();
        }
    });

    // Show loader on navigation clicks
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

        showLoading();
    });

    // Hide loader once page is fully loaded
    window.addEventListener("load", () => {
        overlay.classList.add("hidden");
    });
})();
