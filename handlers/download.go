package handlers

import (
	"io"
	"net/http"
	"os"
	"strconv"

	"linx-minx/helpers/expiry"
	"linx-minx/storage"
)

type DownloadHandler struct {
	backend        *storage.LocalfsBackend
	renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error
}

func NewDownloadHandler(backend *storage.LocalfsBackend, renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error) *DownloadHandler {
	return &DownloadHandler{
		backend:        backend,
		renderTemplate: renderTemplate,
	}
}

func (h *DownloadHandler) render404(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	err := h.renderTemplate("templates/404.html", nil, r, w)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Not Found"))
	}
}

func (h *DownloadHandler) DownloadHandler(w http.ResponseWriter, r *http.Request, randomKey, filename string) {
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

	if parsed.RandomKey != randomKey {
		h.render404(w, r)
		return
	}

	if parsed.OriginalName != filename {
		h.render404(w, r)
		return
	}

	if expiry.IsTsExpired(parsed.ExpiryTimestamp) {
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

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
	w.Header().Set("Cache-Control", "public, no-cache")
	w.Header().Set("Content-Disposition", `attachment; filename="`+parsed.OriginalName+`"`)

	if r.Method == http.MethodHead {
		return
	}

	err = h.backend.ServeFile(fullFilename, w, r)
	if err != nil {
		http.Error(w, "Could not serve file", http.StatusInternalServerError)
		return
	}
}
