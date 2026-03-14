var dzone = document.getElementById("dzone");
dzone.style.display = "block";

var fallback = document.querySelector(".fallback");
if (fallback) fallback.style.display = "none";

var form = document.getElementById("dropzone");
var maxBytes = parseInt(form.getAttribute("data-maxsize"), 10) || Infinity;
var needsAuth = form.getAttribute("data-auth") === "basic";

var engine = UploadEngine.init({
    dropzone: '#dzone',
    url: form.getAttribute("action") || '/upload',
    maxFilesize: maxBytes,
    parallelUploads: 5,
    headers: { "Accept": "application/json" },
    autoProcessQueue: !needsAuth,
    renameFile: function(file) {
        return urlRusLat(file.name);
    },
    onFileAdded: function(file) {
        var index = parseInt(localStorage.getItem("linx-minx-file-index") || "0");
        index++;
        localStorage.setItem("linx-minx-file-index", index.toString());
        file.index = index;

        if (!engine.autoProcessQueue) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== XMLHttpRequest.DONE) return;
                if (xhr.status < 400) {
                    engine.processQueue();
                } else {
                    engine.cancelUpload(file);
                }
            };
            xhr.open("HEAD", "auth", true);
            xhr.send();
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
        cancelAction.addEventListener('click', function(ev) {
            ev.stopPropagation();
            engine.cancelUpload(file);
        });
        file.cancelActionElement = cancelAction;
        fileActions.appendChild(cancelAction);

        file.uploadElement = upload;
        document.getElementById("uploads").prepend(upload);
    },
    onProgress: function(file, p, bytesSent) {
        p = parseInt(p);
        file.progressElement.innerHTML = " (" + p + "%)";
        file.uploadElement.setAttribute("style",
            'background-image: linear-gradient(to right, #F2F4F7 ' + p + '%, #E2E2E2 ' + p + '%)');
    },
    onSending: function(file, xhr, formData) {
        var randomize = document.getElementById("randomize");
        if (randomize != null) {
            formData.append("randomize", randomize.checked);
        }
        formData.append("expires", document.getElementById("expires").value);
    },
    onSuccess: function(file, resp) {
        file.fileActions.removeChild(file.progressElement);

        var fileLabelLink = document.createElement("a");
        fileLabelLink.href = resp.furl;
        fileLabelLink.target = "_blank";
        fileLabelLink.innerHTML = resp.furl.split("/").pop();
        file.fileLabel.innerHTML = "";
        file.fileLabelLink = fileLabelLink;
        file.fileLabel.appendChild(fileLabelLink);

        var sizeSpan = document.createElement("span");
        sizeSpan.className = "file-size";
        sizeSpan.innerHTML = " (" + formatBytes(resp.size) + ")";
        file.fileLabel.appendChild(sizeSpan);

        var files = JSON.parse(localStorage.getItem("linx-minx-files") || "[]");
        files = files.filter(function(f) { return f.furl !== resp.furl; });
        resp.index = file.index || 0;
        files.unshift(resp);
        localStorage.setItem("linx-minx-files", JSON.stringify(files));

        var expiryText = formatExpiry(resp.expiry);
        if (expiryText) {
            var expiryLabel = document.createElement("span");
            expiryLabel.className = "expiry";
            expiryLabel.innerHTML = " " + expiryText;
            file.fileActions.appendChild(expiryLabel);
        }

        var deleteAction = document.createElement("span");
        deleteAction.innerHTML = "✕";
        deleteAction.className = "cancel";
        deleteAction.addEventListener('click', createDeleteHandler(file.uploadElement, deleteAction, resp));
        file.fileActions.removeChild(file.cancelActionElement);
        file.cancelActionElement = deleteAction;
        file.fileActions.appendChild(deleteAction);
    },
    onCanceled: function(file) {
        file.uploadElement.className = "upload strikethrough";
        file.uploadElement.setAttribute("style", "background-color: #f5f5f5");
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
    },
    onError: function(file, message) {
        if (file.progressElement && file.progressElement.parentNode) {
            file.fileActions.removeChild(file.progressElement);
        }
        if (file.cancelActionElement && file.cancelActionElement.parentNode) {
            file.fileActions.removeChild(file.cancelActionElement);
        }
        if (message) {
            file.fileLabel.innerHTML = file.name + ": " + message;
        }
        file.fileLabel.className = "error";
    }
});

document.onpaste = function(event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.kind === "file") {
            engine.addFile(item.getAsFile());
        }
    }
};

function urlRusLat(str) {
    var cyr2latChars = new Array(
        ['а', 'a'],['б', 'b'],['в', 'v'], ['г', 'g'],
        ['д', 'd'],['е', 'e'],['ё', 'yo'],['ж', 'zh'],['з', 'z'],
        ['и', 'i'],['й', 'y'],['к', 'k'], ['л', 'l'],
        ['м', 'm'],['н', 'n'],['о', 'o'], ['п', 'p'], ['р', 'r'],
        ['с', 's'],['т', 't'],['у', 'u'], ['ф', 'f'],
        ['х', 'h'],['ц', 'c'],['ч', 'ch'],['ш', 'sh'],['щ', 'shch'],
        ['ъ', ''], ['ы', 'y'],['ь', ''],  ['э', 'e'], ['ю', 'yu'], ['я', 'ya'],

        ['А', 'A'],['Б', 'B'],['В', 'V'], ['Г', 'G'],
        ['Д', 'D'],['Е', 'E'],['Ё', 'YO'],['Ж', 'ZH'],['З', 'Z'],
        ['И', 'I'],['Й', 'Y'],['К', 'K'], ['Л', 'L'],
        ['М', 'M'],['Н', 'N'],['О', 'O'], ['П', 'P'], ['Р', 'R'],
        ['С', 'S'],['Т', 'T'],['У', 'U'], ['Ф', 'F'],
        ['Х', 'H'],['Ц', 'C'],['Ч', 'CH'],['Ш', 'SH'],['Щ', 'SHCH'],
        ['Ъ', ''], ['Ы', 'Y'],['Ь', ''],  ['Э', 'E'], ['Ю', 'YU'], ['Я', 'YA'],

        ['a', 'a'],['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'],
        ['f', 'f'],['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'],
        ['k', 'k'],['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'],
        ['p', 'p'],['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'],
        ['u', 'u'],['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'],
        ['z', 'z'],

        ['A', 'A'],['B', 'B'],['C', 'C'],['D', 'D'],['E', 'E'],
        ['F', 'F'],['G', 'G'],['H', 'H'],['I', 'I'],['J', 'J'],['K', 'K'],
        ['L', 'L'],['M', 'M'],['N', 'N'],['O', 'O'],['P', 'P'],
        ['Q', 'Q'],['R', 'R'],['S', 'S'],['T', 'T'],['U', 'U'],['V', 'V'],
        ['W', 'W'],['X', 'X'],['Y', 'Y'],['Z', 'Z'],

        ['0', '0'],['1', '1'],['2', '2'],['3', '3'],
        ['4', '4'],['5', '5'],['6', '6'],['7', '7'],['8', '8'],['9', '9'],

        [' ', '_'],['_', '_'],['-', '-'],['—', '-'],['.', '.'],[',', ','],
        ['@', '@'],['!', '!'],['(', '('],[')', ')'],['#', '_']
    );

    var newStr = new String();

    str = str.replace(/крипт/g,"crypt").replace(/Крипт/g,"Crypt").replace(/КРИПТ/g,"CRYPT");

    for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var newCh = '';
        for (var j = 0; j < cyr2latChars.length; j++) {
            if (ch == cyr2latChars[j][0]) {
                newCh = cyr2latChars[j][1];
            }
        }
        newStr += newCh;
    }
    return newStr.replace(/[_]{2,}/gim, '_');
}
