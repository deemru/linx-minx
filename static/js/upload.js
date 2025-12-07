Dropzone.options.dropzone = {
    init: function () {
        var dzone = document.getElementById("dzone");
        dzone.style.display = "block";
    },
    addedfile: function (file) {
        if (!this.options.autoProcessQueue) {
            var dropzone = this;
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (xhr.status < 400) {
                    dropzone.processQueue()
                    dropzone.options.autoProcessQueue = true;
                } else {
                    dropzone.cancelUpload(file)
                }
            };
            xhr.open("HEAD", "auth", true);
            xhr.send()
        }
        var upload = document.createElement("div");
        upload.className = "upload";

        var fileLabel = document.createElement("span");
        fileLabel.innerHTML = file.name;
        file.fileLabel = fileLabel;
        upload.appendChild(fileLabel);

        var fileActions = document.createElement("div");
        fileActions.className = "right";
        file.fileActions = fileActions;
        upload.appendChild(fileActions);

        var progress = document.createElement("span");
        file.progressElement = progress;
        fileActions.appendChild(progress);

        var cancelAction = document.createElement("span");
        cancelAction.className = "cancel";
        cancelAction.innerHTML = "✕";
        cancelAction.addEventListener('click', function (ev) {
            ev.stopPropagation();
            this.removeFile(file);
        }.bind(this));
        file.cancelActionElement = cancelAction;
        fileActions.appendChild(cancelAction);

        file.uploadElement = upload;

        document.getElementById("uploads").prepend(upload);
    },
    uploadprogress: function (file, p, bytesSent) {
        p = parseInt(p);
        file.progressElement.innerHTML = " (" + p + "%)";
        file.uploadElement.setAttribute("style", 'background-image: -webkit-linear-gradient(left, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%); background-image: -moz-linear-gradient(left, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%); background-image: -ms-linear-gradient(left, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%); background-image: -o-linear-gradient(left, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%); background-image: linear-gradient(left, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%)');
    },
    sending: function (file, xhr, formData) {
        var randomize = document.getElementById("randomize");
        if (randomize != null) {
            formData.append("randomize", randomize.checked);
        }
        formData.append("expires", document.getElementById("expires").value);
    },
    success: function (file, resp) {
        file.fileActions.removeChild(file.progressElement);

        var fileLabelLink = document.createElement("a");
        fileLabelLink.href = resp.furl;
        fileLabelLink.target = "_blank";
        fileLabelLink.innerHTML = resp.furl.split("/").pop();
        file.fileLabel.innerHTML = "";
        file.fileLabelLink = fileLabelLink;
        file.fileLabel.appendChild(fileLabelLink);

        var fileSize = parseInt(resp.size);
        var sizeText = "";
        if (fileSize < 1024) {
            sizeText = fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            sizeText = (fileSize / 1024).toFixed(1) + " KiB";
        } else if (fileSize < 1024 * 1024 * 1024) {
            sizeText = (fileSize / (1024 * 1024)).toFixed(1) + " MiB";
        } else {
            sizeText = (fileSize / (1024 * 1024 * 1024)).toFixed(1) + " GiB";
        }

        var sizeSpan = document.createElement("span");
        sizeSpan.className = "file-size";
        sizeSpan.innerHTML = " (" + sizeText + ")";
        file.fileLabel.appendChild(sizeSpan);

        localStorage.setItem(resp.furl,JSON.stringify(resp));

        var expiryLabel = document.createElement("span");
        var expiryTimestamp = parseInt(resp.expiry);
        if (expiryTimestamp === 0) {
            expiryLabel.innerHTML = "";
        } else {
            var expiryDate = new Date(expiryTimestamp * 1000);
            var now = new Date();
            var timeDiff = expiryDate - now;

            if (timeDiff <= 0) {
                expiryLabel.innerHTML = " (expired)";
            } else {
                var daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                var hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                var minutesDiff = Math.floor(timeDiff / (1000 * 60));

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
            file.fileActions.appendChild(expiryLabel);
        }

        var deleteAction = document.createElement("span");
        deleteAction.innerHTML = "✕";
        deleteAction.className = "cancel";
        deleteAction.addEventListener('click', function (ev) {
            xhr = new XMLHttpRequest();
            xhr.open("DELETE", resp.furl, true);
            xhr.setRequestHeader("dkey", resp.dkey);
            xhr.onreadystatechange = function (file) {
                if (xhr.readyState == 4 && (xhr.status === 200 || xhr.status === 404)) {
                    file.uploadElement.className = "upload strikethrough";
                    file.uploadElement.setAttribute("style","background-color: #f5f5f5");
                    file.cancelActionElement.className = "cancel disabled";
                    file.cancelActionElement.style.pointerEvents = "none";
                    file.cancelActionElement.style.opacity = "0.5";
                    localStorage.removeItem(resp.furl);
                    setTimeout(function() {
                        if (file.uploadElement && file.uploadElement.parentNode) {
                            file.uploadElement.parentNode.removeChild(file.uploadElement);
                        }
                    }, 1000);
                }
            }.bind(this, file);
            xhr.send();
        });
        file.fileActions.removeChild(file.cancelActionElement);
        file.cancelActionElement = deleteAction;
        file.fileActions.appendChild(deleteAction);

    },
    canceled: function (file) {
        this.options.error(file);
    },
    error: function (file, resp, xhrO) {
        if (file.status === "canceled") {
            file.uploadElement.className = "upload strikethrough";
            file.uploadElement.setAttribute("style","background-color: #f5f5f5");
            if (file.progressElement) {
                file.progressElement.style.opacity = "0.5";
            }
            if (file.cancelActionElement) {
                file.cancelActionElement.className = "cancel disabled";
                file.cancelActionElement.style.pointerEvents = "none";
                file.cancelActionElement.style.opacity = "0.5";
            }
            setTimeout(function() {
                if (file.uploadElement && file.uploadElement.parentNode) {
                    file.uploadElement.parentNode.removeChild(file.uploadElement);
                }
            }, 1000);
        } else {
            if (file.progressElement && file.progressElement.parentNode) {
                file.fileActions.removeChild(file.progressElement);
            }
            if (file.cancelActionElement && file.cancelActionElement.parentNode) {
                file.fileActions.removeChild(file.cancelActionElement);
            }
            if (resp && resp.error) {
                file.fileLabel.innerHTML = file.name + ": " + resp.error;
            }
            else if (resp && typeof resp === "string" && resp.includes("<html")) {
                file.fileLabel.innerHTML = file.name + ": Server Error";
            }
            else if (resp) {
                file.fileLabel.innerHTML = file.name + ": " + resp;
            }
        }
        file.fileLabel.className = "error";
    },

    autoProcessQueue: document.getElementById("dropzone").getAttribute("data-auth") !== "basic",
    removedfile: function (file) {
        if (file.uploadElement) {
            file.uploadElement.className = "upload strikethrough";
            file.uploadElement.setAttribute("style","background-color: #f5f5f5");
            if (file.progressElement) {
                file.progressElement.style.opacity = "0.5";
            }
            if (file.cancelActionElement) {
                file.cancelActionElement.className = "cancel disabled";
                file.cancelActionElement.style.pointerEvents = "none";
                file.cancelActionElement.style.opacity = "0.5";
            }
            setTimeout(function() {
                if (file.uploadElement && file.uploadElement.parentNode) {
                    file.uploadElement.parentNode.removeChild(file.uploadElement);
                }
            }, 1000);
        }
    },
    maxFilesize: Math.round(parseInt(document.getElementById("dropzone").getAttribute("data-maxsize"), 10) / 1024 / 1024),
    previewsContainer: "#uploads",
    parallelUploads: 5,
    headers: { "Accept": "application/json" },
    dictDefaultMessage: "Click or Drop file(s) or Paste image",
    dictFallbackMessage: ""
};

document.onpaste = function (event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (index in items) {
        var item = items[index];
        if (item.kind === "file") {
            Dropzone.forElement("#dropzone").addFile(item.getAsFile());
        }
    }
};
