var copyBtnTimeout = null;
var copyBtnOriginalText = null;

function showCopied() {
    var btn = document.querySelector('.copy-btn');
    if (btn && copyBtnOriginalText) {
        if (copyBtnTimeout) {
            btn.blur();
            return;
        }
        btn.textContent = 'Copied!';
        btn.blur();
        copyBtnTimeout = setTimeout(function() {
            btn.textContent = copyBtnOriginalText;
            copyBtnTimeout = null;
        }, 2000);
    }
}

function copyDownloadLink() {
    if (copyBtnTimeout) {
        var btn = document.querySelector('.copy-btn');
        if (btn) {
            btn.blur();
        }
        return;
    }

    var btn = document.querySelector('.copy-btn');
    if (btn) {
        btn.blur();
    }

    var link = document.getElementById('download-link');
    if (!link) {
        return;
    }

    var href = link.getAttribute('href');
    var fullUrl = '';

    if (href.indexOf('http') === 0) {
        fullUrl = href;
    } else {
        fullUrl = window.location.origin + (href.charAt(0) === '/' ? href : '/' + href);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).then(function() {
            showCopied();
        }).catch(function(err) {
            console.error('Copy error:', err);
            fallbackCopyTextToClipboard(fullUrl);
        });
    } else {
        fallbackCopyTextToClipboard(fullUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        if (successful) {
            showCopied();
        } else {
            console.error('Failed to copy');
        }
    } catch (err) {
        console.error('Copy error:', err);
    }

    document.body.removeChild(textArea);
}

function initButtons() {
    var copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtnOriginalText = copyBtn.textContent;
        copyBtn.addEventListener('click', copyDownloadLink);
    }

    var downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            setTimeout(function() {
                downloadBtn.blur();
            }, 0);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
} else {
    initButtons();
}

