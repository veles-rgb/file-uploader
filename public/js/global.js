(function () {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;

    function showLoading() {
        overlay.classList.remove("hidden");
        document.querySelectorAll("button, input[type=submit]").forEach(btn => {
            btn.disabled = true;
        });
    }

    function hideLoading() {
        overlay.classList.add("hidden");
        document.querySelectorAll("button, input[type=submit]").forEach(btn => {
            btn.disabled = false;
        });
    }

    window.addEventListener("pageshow", (e) => {
        hideLoading();
    });

    window.addEventListener("beforeunload", () => {
        showLoading();
    });

    document.addEventListener("submit", (e) => {
        if (e.target.tagName === "FORM") showLoading();
    });

    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;

        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (link.target && link.target !== "_self") return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

        if (link.hasAttribute("download")) return;

        showLoading();
    });

    window.addEventListener("load", () => {
        hideLoading();
    });
})();
