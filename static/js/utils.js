function formatBytes(bytes) {
    bytes = parseInt(bytes);
    if (bytes < 1024) {
        return bytes + " B";
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KiB";
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MiB";
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GiB";
    }
}

function formatExpiry(expiryTimestamp) {
    expiryTimestamp = parseInt(expiryTimestamp);
    if (expiryTimestamp === 0) {
        return "";
    }

    var expiryDate = new Date(expiryTimestamp * 1000);
    var now = new Date();
    var timeDiff = expiryDate - now;

    if (timeDiff <= 0) {
        return "(expired)";
    }

    var daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    var hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    var minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (daysDiff > 0) {
        return daysDiff === 1 ? "(1 day)" : "(" + daysDiff + " days)";
    } else if (hoursDiff > 0) {
        return hoursDiff === 1 ? "(1 hour)" : "(" + hoursDiff + " hours)";
    } else if (minutesDiff > 0) {
        return minutesDiff === 1 ? "(1 minute)" : "(" + minutesDiff + " minutes)";
    } else {
        return "(expired)";
    }
}

function createDeleteHandler(upload, cancelAction, resp) {
    return function(ev) {
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", resp.furl, true);
        xhr.setRequestHeader("dkey", resp.dkey);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (xhr.status === 200 || xhr.status === 404)) {
                upload.className = "upload strikethrough";
                upload.setAttribute("style", "background-color: #f5f5f5");
                cancelAction.className = "cancel disabled";
                cancelAction.style.pointerEvents = "none";
                cancelAction.style.opacity = "0.5";
                var files = JSON.parse(localStorage.getItem("linx-minx-files") || "[]");
                files = files.filter(function(f) { return f.furl !== resp.furl; });
                localStorage.setItem("linx-minx-files", JSON.stringify(files));
                setTimeout(function() {
                    if (upload && upload.parentNode) {
                        upload.parentNode.removeChild(upload);
                    }
                }, 1000);
            }
        };
        xhr.send();
    };
}
