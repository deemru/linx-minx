package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"linx-minx/helpers/cleanup"
)

func main() {
	log.Printf("Config: bind=%s, filesDir=%s, sitePath=%s, siteName=%s, maxSize=%d, maxExpiry=%d, cleanupEveryMinutes=%d, keyLength=%d",
		Config.bind, Config.filesDir, Config.sitePath, Config.siteName, Config.maxSize, Config.maxExpiry, Config.cleanupEveryMinutes, Config.keyLength)

	handler := setupRoutes()

	if Config.cleanupEveryMinutes > 0 {
		interval := time.Duration(Config.cleanupEveryMinutes) * time.Minute
		go cleanup.PeriodicCleanup(interval, Config.filesDir)
	}

	srv := &http.Server{
		Addr:    Config.bind,
		Handler: handler,
	}

	go func() {
		log.Printf("Serving over http, bound on %s", Config.bind)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed:", err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

}
