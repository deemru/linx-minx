(function() {
    function initExpiryButtons() {
        var select = document.getElementById("expires");
        if (!select) return;

        var buttons = document.querySelectorAll(".expiry-btn");
        if (buttons.length === 0) return;

        var defaultButton = null;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute("data-default") === "true") {
                defaultButton = buttons[i];
                break;
            }
        }
        if (!defaultButton && buttons.length > 0) {
            defaultButton = buttons[0];
        }

        if (defaultButton) {
            defaultButton.classList.add("active");
            select.value = defaultButton.getAttribute("data-value");
        }

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", function() {
                for (var j = 0; j < buttons.length; j++) {
                    buttons[j].classList.remove("active");
                }

                this.classList.add("active");

                var value = this.getAttribute("data-value");
                select.value = value;

                var changeEvent = new Event("change", { bubbles: true });
                select.dispatchEvent(changeEvent);
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initExpiryButtons);
    } else {
        initExpiryButtons();
    }
})();

