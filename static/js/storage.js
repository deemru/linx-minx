var thisMoment = Date.now();

var files = JSON.parse(localStorage.getItem("linx-minx-files") || "[]");
var validFiles = [];

for (var i = 0; i < files.length; i++) {
    var resp = files[i];
    var expiryTimestamp = parseInt(resp.expiry);

    if (expiryTimestamp !== 0) {
        var expiryDate = new Date(expiryTimestamp * 1000);
        if (expiryDate < thisMoment) {
            continue;
        }
    }

    validFiles.push(resp);
}

validFiles.sort(function(a, b) {
    var indexA = a.index || 0;
    var indexB = b.index || 0;
    return indexB - indexA;
});

if (validFiles.length !== files.length) {
    localStorage.setItem("linx-minx-files", JSON.stringify(validFiles));
}

if (validFiles.length === 0) {
    localStorage.removeItem("linx-minx-files");
    localStorage.removeItem("linx-minx-file-index");
} else {
    for (var i = 0; i < validFiles.length; i++) {
        var resp = validFiles[i];

        var upload = document.createElement("div");
        upload.className = "upload";

        var fileLabel = document.createElement("span");

        var fileLabelLink = document.createElement("a");
        fileLabelLink.href = resp.furl;
        fileLabelLink.target = "_blank";
        fileLabelLink.innerHTML = resp.furl.split("/").pop();

        fileLabel.appendChild(fileLabelLink);

        var sizeSpan = document.createElement("span");
        sizeSpan.className = "file-size";
        sizeSpan.innerHTML = " (" + formatBytes(resp.size) + ")";
        fileLabel.appendChild(sizeSpan);

        upload.appendChild(fileLabel);
        var fileActions = document.createElement("div");
        fileActions.className = "right";

        var expiryText = formatExpiry(resp.expiry);
        if (expiryText) {
            var expiryLabel = document.createElement("span");
            expiryLabel.className = "expiry";
            expiryLabel.innerHTML = " " + expiryText;
            fileActions.appendChild(expiryLabel);
        }

        var deleteAction = document.createElement("span");
        deleteAction.innerHTML = "✕";
        deleteAction.className = "cancel";
        deleteAction.addEventListener('click', createDeleteHandler(upload, deleteAction, resp));
        fileActions.appendChild(deleteAction);
        upload.appendChild(fileActions);
        var uploadsContainer = document.querySelector("#uploads");
        uploadsContainer.appendChild(upload);
    }
}
