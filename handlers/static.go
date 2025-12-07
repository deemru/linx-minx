package handlers

import (
	"bytes"
	"fmt"
	"io/fs"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

var timeStarted = time.Now()

func StaticHandler(staticFS fs.FS, w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	if strings.HasSuffix(path, "/") {
		http.NotFound(w, r)
		return
	}

	if path == "/favicon.ico" || path == "/favicon.svg" {
		path = "/static/images/favicon.svg"
	}

	filePath := strings.TrimPrefix(path, "/")

	if !strings.HasPrefix(filePath, "static/") {
		filePath = "static/" + filePath
	}

	fileBytes, err := fs.ReadFile(staticFS, filePath)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Etag", fmt.Sprintf("\"%d\"", timeStarted.Unix()))
	w.Header().Set("Cache-Control", "public, max-age=86400")

	ext := filepath.Ext(path)
	switch ext {
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
	}

	http.ServeContent(w, r, filepath.Base(filePath), timeStarted, bytes.NewReader(fileBytes))
}

func RobotsHandler(staticFS fs.FS, w http.ResponseWriter, r *http.Request) {
	fileBytes, err := fs.ReadFile(staticFS, "static/robots.txt")
	if err != nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	http.ServeContent(w, r, "robots.txt", timeStarted, bytes.NewReader(fileBytes))
}
