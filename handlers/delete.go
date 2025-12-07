package handlers

import (
	"fmt"
	"net/http"
	"os"

	"linx-minx/storage"
)

type DeleteHandler struct {
	backend *storage.LocalfsBackend
}

func NewDeleteHandler(backend *storage.LocalfsBackend) *DeleteHandler {
	return &DeleteHandler{
		backend: backend,
	}
}

func (h *DeleteHandler) DeleteHandler(w http.ResponseWriter, r *http.Request, randomKey string) {
	requestDeleteKey := r.Header.Get("dkey")
	if requestDeleteKey == "" {
		http.Error(w, "dkey header required", http.StatusUnauthorized)
		return
	}

	pattern := randomKey + ".*"
	fullFilename, err := h.backend.FindByPattern(pattern)
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(w, r)
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
		http.NotFound(w, r)
		return
	}

	if parsed.DeleteKey != requestDeleteKey {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = h.backend.Delete(fullFilename)
	if err != nil {
		http.Error(w, "Could not delete file", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "DELETED")
}
