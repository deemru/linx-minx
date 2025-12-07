package handlers

import (
	"io"
	"net/http"

	"linx-minx/helpers"
)

type PagesHandlers struct {
	renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error
	maxSize        int64
	maxExpiry      uint64
}

func NewPagesHandlers(
	renderTemplate func(string, map[string]interface{}, *http.Request, io.Writer) error,
	maxSize int64,
	maxExpiry uint64,
) *PagesHandlers {
	return &PagesHandlers{
		renderTemplate: renderTemplate,
		maxSize:        maxSize,
		maxExpiry:      maxExpiry,
	}
}

func (h *PagesHandlers) IndexHandler(w http.ResponseWriter, r *http.Request) {
	context := map[string]interface{}{
		"maxsize":    h.maxSize,
		"expirylist": helpers.ListExpirationTimes(h.maxExpiry),
	}

	err := h.renderTemplate("templates/index.html", context, r, w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *PagesHandlers) HTTP403Handler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusForbidden)
	err := h.renderTemplate("templates/403.html", nil, r, w)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		h.renderTemplate("templates/404.html", nil, r, w)
	}
}

func (h *PagesHandlers) NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	err := h.renderTemplate("templates/404.html", nil, r, w)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Not Found"))
	}
}
