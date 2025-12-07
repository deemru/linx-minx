package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"linx-minx/helpers"
	"linx-minx/storage"
)

var (
	ErrFileTooLarge = errors.New("file too large")
	ErrFileEmpty    = errors.New("file is empty")
)

const allowedChars = "A-Za-z0-9-._@!(),"

type UploadHandler struct {
	backend   *storage.LocalfsBackend
	maxSize   int64
	maxExpiry uint64
	keyLength int
}

func NewUploadHandler(backend *storage.LocalfsBackend, maxSize int64, maxExpiry uint64, keyLength int) *UploadHandler {
	return &UploadHandler{
		backend:   backend,
		maxSize:   maxSize,
		maxExpiry: maxExpiry,
		keyLength: keyLength,
	}
}

func generateRandomKey(length int) (string, error) {
	bytesNeeded := (length*3 + 3) / 4
	if bytesNeeded < 1 {
		bytesNeeded = 1
	}
	bytes := make([]byte, bytesNeeded)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	encoded := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(bytes)
	if len(encoded) > length {
		encoded = encoded[:length]
	}
	return encoded, nil
}

func sanitizeFilename(filename string) string {
	reg := regexp.MustCompile("[^" + allowedChars + "]+")
	sanitized := reg.ReplaceAllString(filename, "")
	if len(sanitized) == 0 {
		return "no.name"
	}
	return sanitized
}

func parseExpiry(expStr string, maxExpiry uint64) uint64 {
	if expStr == "" {
		return maxExpiry
	}
	expiry, err := strconv.ParseUint(expStr, 10, 64)
	if err != nil {
		return maxExpiry
	}
	if maxExpiry > 0 && expiry > maxExpiry {
		return maxExpiry
	}
	return expiry
}

func calculateExpiryTimestamp(expirySeconds uint64) int64 {
	if expirySeconds == 0 {
		return 0 // Forever
	}
	return time.Now().Add(time.Duration(expirySeconds) * time.Second).Unix()
}

func (h *UploadHandler) UploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	reader, err := r.MultipartReader()
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	randomKey, err := generateRandomKey(h.keyLength)
	if err != nil {
		http.Error(w, "Could not generate random key", http.StatusInternalServerError)
		return
	}

	deleteKey, err := generateRandomKey(h.keyLength)
	if err != nil {
		http.Error(w, "Could not generate delete key", http.StatusInternalServerError)
		return
	}

	fileWriter, _, err := h.backend.CreateTempFile(randomKey, deleteKey)
	if err != nil {
		http.Error(w, "Could not create temp file", http.StatusInternalServerError)
		return
	}
	defer fileWriter.Close()

	var filename string
	var expiresStr string
	var fileErr error
	var fileSize int64

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			fileWriter.Close()
			fileWriter.(*storage.TempFileWriter).Abort()
			http.Error(w, "Could not read multipart part", http.StatusBadRequest)
			return
		}

		formName := part.FormName()
		switch formName {
		case "expires":
			expiresBytes := make([]byte, 64)
			n, _ := part.Read(expiresBytes)
			if n > 0 {
				expiresStr = strings.TrimSpace(string(expiresBytes[:n]))
			}
			io.Copy(io.Discard, part)
			part.Close()
		case "file":
			filename = part.FileName()
			if filename == "" {
				filename = "unnamed"
			}
			limitedReader := io.LimitReader(part, h.maxSize+1)
			written, err := io.Copy(fileWriter, limitedReader)
			fileSize = written
			if err != nil {
				fileErr = err
			}
			if fileSize > h.maxSize {
				fileErr = errors.New("file too large")
			}
			if fileSize == 0 {
				fileErr = errors.New("file is empty")
			}
			part.Close()
		default:
			io.Copy(io.Discard, part)
			part.Close()
		}
	}

	fileWriter.Close()

	if fileErr != nil {
		fileWriter.(*storage.TempFileWriter).Abort()
		if fileErr.Error() == "file too large" {
			respondError(w, r, ErrFileTooLarge.Error(), http.StatusBadRequest)
			return
		}
		if fileErr.Error() == "file is empty" {
			respondError(w, r, ErrFileEmpty.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, "Could not upload file: "+fileErr.Error(), http.StatusBadRequest)
		return
	}

	if filename == "" {
		fileWriter.(*storage.TempFileWriter).Abort()
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}

	expirySeconds := parseExpiry(expiresStr, h.maxExpiry)
	expiryTimestamp := calculateExpiryTimestamp(expirySeconds)
	sanitizedFilename := sanitizeFilename(filename)

	tempWriter := fileWriter.(*storage.TempFileWriter)
	err = tempWriter.RenameToFinal(expiryTimestamp, sanitizedFilename)
	if err != nil {
		http.Error(w, "Could not rename file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	written := fileSize

	siteURL := helpers.GetSiteURL(r)
	displayURL := siteURL + "/f/" + randomKey + "/" + sanitizedFilename

	if strings.EqualFold("application/json", r.Header.Get("Accept")) {
		respondJSON(w, displayURL, sanitizedFilename, deleteKey, expiryTimestamp, written)
	} else {
		http.Redirect(w, r, displayURL, http.StatusSeeOther)
	}
}

func respondJSON(w http.ResponseWriter, displayURL, filename, deleteKey string, expiryTimestamp int64, size int64) {
	js, _ := json.Marshal(map[string]string{
		"furl":     displayURL,
		"filename": filename,
		"dkey":     deleteKey,
		"expiry":   strconv.FormatInt(expiryTimestamp, 10),
		"size":     strconv.FormatInt(size, 10),
	})
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Write(js)
}

func respondError(w http.ResponseWriter, r *http.Request, message string, statusCode int) {
	if strings.EqualFold("application/json", r.Header.Get("Accept")) {
		js, _ := json.Marshal(map[string]string{
			"error": message,
		})
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(statusCode)
		w.Write(js)
	} else {
		http.Error(w, message, statusCode)
	}
}
