package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"regexp"

	"linx-minx/handlers"
	"linx-minx/storage"
)

const allowedChars = "A-Za-z0-9-._@!(),"

func setupRoutes() http.Handler {
	err := os.MkdirAll(Config.filesDir, 0755)
	if err != nil {
		log.Fatal("Could not create files directory:", err)
	}

	backend := storage.NewLocalfsBackend(Config.filesDir)

	renderTemplateWrapper := func(tplPath string, context map[string]interface{}, r *http.Request, w io.Writer) error {
		return renderTemplate(tplPath, context, r, w)
	}

	pagesHandlers := handlers.NewPagesHandlers(renderTemplateWrapper, Config.maxSize, Config.maxExpiry)
	uploadHandler := handlers.NewUploadHandler(backend, Config.maxSize, Config.maxExpiry, Config.keyLength)
	displayHandler := handlers.NewDisplayHandler(backend, renderTemplateWrapper, Config.maxExpiry)
	downloadHandler := handlers.NewDownloadHandler(backend, renderTemplateWrapper)
	deleteHandler := handlers.NewDeleteHandler(backend)

	mux := http.NewServeMux()

	// Format: /f/{randomKey}/{filename}
	fPattern := regexp.MustCompile("^/f/([" + allowedChars + "]+)/([" + allowedChars + "]+)$")
	mux.HandleFunc("/f/", func(w http.ResponseWriter, r *http.Request) {
		matches := fPattern.FindStringSubmatch(r.URL.Path)
		if len(matches) == 3 {
			randomKey := matches[1]
			filename := matches[2]
			if r.Method == http.MethodDelete {
				deleteHandler.DeleteHandler(w, r, randomKey)
			} else {
				displayHandler.DisplayHandler(w, r, randomKey, filename)
			}
			return
		}
		pagesHandlers.NotFoundHandler(w, r)
	})

	// Format: /d/{randomKey}/{filename}
	dPattern := regexp.MustCompile("^/d/([" + allowedChars + "]+)/([" + allowedChars + "]+)$")
	mux.HandleFunc("/d/", func(w http.ResponseWriter, r *http.Request) {
		matches := dPattern.FindStringSubmatch(r.URL.Path)
		if len(matches) == 3 {
			randomKey := matches[1]
			filename := matches[2]
			downloadHandler.DownloadHandler(w, r, randomKey, filename)
		} else {
			pagesHandlers.NotFoundHandler(w, r)
		}
	})

	mux.HandleFunc("/upload", uploadHandler.UploadHandler)
	mux.HandleFunc("/static/", func(w http.ResponseWriter, r *http.Request) {
		handlers.StaticHandler(staticFS, w, r)
	})
	mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		handlers.StaticHandler(staticFS, w, r)
	})
	mux.HandleFunc("/favicon.svg", func(w http.ResponseWriter, r *http.Request) {
		handlers.StaticHandler(staticFS, w, r)
	})
	mux.HandleFunc("/robots.txt", func(w http.ResponseWriter, r *http.Request) {
		handlers.RobotsHandler(staticFS, w, r)
	})
	mux.HandleFunc("/403/", pagesHandlers.HTTP403Handler)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			pagesHandlers.IndexHandler(w, r)
		} else {
			pagesHandlers.NotFoundHandler(w, r)
		}
	})

	return loggingMiddleware(mux)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
