package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"linx-minx/helpers"
	"linx-minx/helpers/expiry"
	"linx-minx/storage"
)

type DisplayHandler struct {
	backend        *storage.LocalfsBackend
	renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error
	maxExpiry      uint64
}

func NewDisplayHandler(
	backend *storage.LocalfsBackend,
	renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error,
	maxExpiry uint64,
) *DisplayHandler {
	return &DisplayHandler{
		backend:        backend,
		renderTemplate: renderTemplate,
		maxExpiry:      maxExpiry,
	}
}

func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func formatExpiryText(expiryTimestamp int64) string {
	if expiryTimestamp == 0 {
		return "never expires"
	}

	now := time.Now()
	expiryTime := time.Unix(expiryTimestamp, 0)
	timeUntilExpiry := expiryTime.Sub(now)

	if timeUntilExpiry <= 0 {
		return "expired"
	}

	return helpers.FormatRelTime(now, expiryTime)
}

func (h *DisplayHandler) render404(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	err := h.renderTemplate("templates/404.html", nil, r, w)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Not Found"))
	}
}

func (h *DisplayHandler) DisplayHandler(w http.ResponseWriter, r *http.Request, randomKey, filename string) {
	pattern := randomKey + ".*"
	fullFilename, err := h.backend.FindByPattern(pattern)
	if err != nil {
		if os.IsNotExist(err) {
			h.render404(w, r)
			return
		}
		http.Error(w, "Could not find file", http.StatusInternalServerError)
		return
	}

	parsed, err := storage.ParseFilename(fullFilename)
	if err != nil {
		http.Error(w, "Invalid filename format", http.StatusInternalServerError)
		return
	}

	if expiry.IsTsExpired(parsed.ExpiryTimestamp) {
		h.render404(w, r)
		return
	}

	if parsed.RandomKey != randomKey {
		h.render404(w, r)
		return
	}

	filePath := h.backend.GetFilePath(fullFilename)
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		http.Error(w, "Could not get file info", http.StatusInternalServerError)
		return
	}
	size := fileInfo.Size()

	sizeText := formatBytes(size)
	expiryText := formatExpiryText(parsed.ExpiryTimestamp)

	siteURL := helpers.GetSiteURL(r)
	downloadURL := "d/" + randomKey + "/" + parsed.OriginalName

	context := map[string]interface{}{
		"filename": parsed.OriginalName,
		"download": downloadURL,
		"size":     sizeText,
		"expiry":   expiryText,
		"siteurl":  strings.TrimSuffix(siteURL, "/"),
	}

	err = h.renderTemplate("templates/display/file.html", context, r, w)
	if err != nil {
		http.Error(w, "Could not render template", http.StatusInternalServerError)
		return
	}
}
