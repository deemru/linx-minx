function copyDownloadLink() {
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
            var btn = document.querySelector('.copy-btn');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
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
            var btn = document.querySelector('.copy-btn');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        } else {
            console.error('Failed to copy');
        }
    } catch (err) {
        console.error('Copy error:', err);
    }

    document.body.removeChild(textArea);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        var copyBtn = document.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyDownloadLink);
        }
    });
} else {
    var copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyDownloadLink);
    }
}

