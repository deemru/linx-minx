var thisMoment = parseInt(Date.now());
for (let localStorageKey in localStorage) {

    if (localStorageKey.split("/").length !== 6) {continue;};

    let resp = JSON.parse(localStorage.getItem(localStorageKey));

    let expiryTimestamp = parseInt(resp.expiry);
    if (expiryTimestamp !== 0) {
        let expiryDate = new Date(expiryTimestamp * 1000);
        if (expiryDate < thisMoment) {
            localStorage.removeItem(resp.furl);
            continue;
        };
    }

    let upload = document.createElement("div");
    upload.className = "upload";

    let fileLabel = document.createElement("span");

    let fileLabelLink = document.createElement("a");
    fileLabelLink.href = resp.furl;
    fileLabelLink.target = "_blank";
    fileLabelLink.innerHTML = resp.furl.split("/").pop();

    fileLabel.appendChild(fileLabelLink);

    let fileSize = parseInt(resp.size);
    let sizeText = "";
    if (fileSize < 1024) {
        sizeText = fileSize + " B";
    } else if (fileSize < 1024 * 1024) {
        sizeText = (fileSize / 1024).toFixed(1) + " KiB";
    } else if (fileSize < 1024 * 1024 * 1024) {
        sizeText = (fileSize / (1024 * 1024)).toFixed(1) + " MiB";
    } else {
        sizeText = (fileSize / (1024 * 1024 * 1024)).toFixed(1) + " GiB";
    }

    let sizeSpan = document.createElement("span");
    sizeSpan.className = "file-size";
    sizeSpan.innerHTML = " (" + sizeText + ")";
    fileLabel.appendChild(sizeSpan);

    upload.appendChild(fileLabel);
    let fileActions = document.createElement("div");
    fileActions.className = "right";

    let expiryLabel = document.createElement("span");
    if (expiryTimestamp === 0) {
        expiryLabel.innerHTML = "";
    } else {
        let expiryDate = new Date(expiryTimestamp * 1000);
        let now = new Date();
        let timeDiff = expiryDate - now;

        if (timeDiff <= 0) {
            expiryLabel.innerHTML = " (expired)";
        } else {
            let daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            let hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
            let minutesDiff = Math.floor(timeDiff / (1000 * 60));

            if (daysDiff > 0) {
                if (daysDiff === 1) {
                    expiryLabel.innerHTML = " (1 day)";
                } else {
                    expiryLabel.innerHTML = " (" + daysDiff + " days)";
                }
            } else if (hoursDiff > 0) {
                if (hoursDiff === 1) {
                    expiryLabel.innerHTML = " (1 hour)";
                } else {
                    expiryLabel.innerHTML = " (" + hoursDiff + " hours)";
                }
            } else if (minutesDiff > 0) {
                if (minutesDiff === 1) {
                    expiryLabel.innerHTML = " (1 minute)";
                } else {
                    expiryLabel.innerHTML = " (" + minutesDiff + " minutes)";
                }
            } else {
                expiryLabel.innerHTML = " (expired)";
            }
        }
    }
    expiryLabel.className = "expiry";
    if (expiryLabel.innerHTML.trim() !== "") {
        fileActions.appendChild(expiryLabel);
    }

    let deleteAction = document.createElement("span");
    deleteAction.innerHTML = "✕";
    deleteAction.className = "cancel";
    deleteAction.addEventListener('click', function (ev) {
        xhr = new XMLHttpRequest();
        xhr.open("DELETE", resp.furl, true);
        xhr.setRequestHeader("dkey", resp.dkey);
        xhr.onreadystatechange = function (fileLabel, fileLabelLink, deleteAction, expiryLabel, upload, resp) {
            if (xhr.readyState == 4 && (xhr.status === 200 || xhr.status === 404)) {
                upload.className = "upload strikethrough";
                upload.setAttribute("style","background-color: #f5f5f5");
                deleteAction.className = "cancel disabled";
                deleteAction.style.pointerEvents = "none";
                deleteAction.style.opacity = "0.5";
                localStorage.removeItem(resp.furl);
                setTimeout(function() {
                    if (upload && upload.parentNode) {
                        upload.parentNode.removeChild(upload);
                    }
                }, 1000);
            }
        }.bind(null, fileLabel, fileLabelLink, deleteAction, expiryLabel, upload, resp);
        xhr.send();
    });
    fileActions.appendChild(deleteAction);
    upload.appendChild(fileActions);
    document.querySelector("#uploads").appendChild(upload);
}