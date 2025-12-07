package cleanup

import (
	"os"
	"strconv"
	"strings"
	"time"

	"linx-minx/helpers/expiry"
	"linx-minx/storage"
)

// Format: randomKey.deleteKey.expiry.filename
func Cleanup(filesDir string) {
	backend := storage.NewLocalfsBackend(filesDir)

	files, err := os.ReadDir(filesDir)
	if err != nil {
		return
	}

	for _, file := range files {
		if file.IsDir() || strings.HasPrefix(file.Name(), ".tmp-") {
			continue
		}

		filename := file.Name()

		parts := strings.Split(filename, ".")
		if len(parts) < 4 {
			continue
		}

		expiryStr := parts[2]
		expiryTimestamp, err := strconv.ParseInt(expiryStr, 10, 64)
		if err != nil {
			continue
		}

		if expiry.IsTsExpired(expiryTimestamp) {
			backend.Delete(filename)
		}
	}
}

func PeriodicCleanup(interval time.Duration, filesDir string) {
	Cleanup(filesDir)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		Cleanup(filesDir)
	}
}
