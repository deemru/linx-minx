(function() {
    var STORAGE_KEY = "linx-minx-expiry";

    function initExpiryButtons() {
        var select = document.getElementById("expires");
        if (!select) return;

        var buttons = document.querySelectorAll(".expiry-btn");
        if (buttons.length === 0) return;

        var savedValue = localStorage.getItem(STORAGE_KEY);
        var selectedButton = null;

        if (savedValue) {
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute("data-value") === savedValue) {
                    selectedButton = buttons[i];
                    break;
                }
            }
        }

        if (!selectedButton) {
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute("data-default") === "true") {
                    selectedButton = buttons[i];
                    break;
                }
            }
        }

        if (!selectedButton && buttons.length > 0) {
            selectedButton = buttons[0];
        }

        if (selectedButton) {
            selectedButton.classList.add("active");
            var value = selectedButton.getAttribute("data-value");
            select.value = value;
            localStorage.setItem(STORAGE_KEY, value);
        }

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", function() {
                for (var j = 0; j < buttons.length; j++) {
                    buttons[j].classList.remove("active");
                }

                this.classList.add("active");

                var value = this.getAttribute("data-value");
                select.value = value;
                localStorage.setItem(STORAGE_KEY, value);

                var changeEvent = new Event("change", { bubbles: true });
                select.dispatchEvent(changeEvent);

                this.blur();
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initExpiryButtons);
    } else {
        initExpiryButtons();
    }
})();

