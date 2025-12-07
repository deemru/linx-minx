package storage

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type ParsedFilename struct {
	OriginalName    string
	RandomKey       string
	DeleteKey       string
	ExpiryTimestamp int64
}

type LocalfsBackend struct {
	filesPath string
}

func NewLocalfsBackend(filesPath string) *LocalfsBackend {
	return &LocalfsBackend{
		filesPath: filesPath,
	}
}

func (b *LocalfsBackend) GetFilePath(filename string) string {
	return filepath.Join(b.filesPath, filename)
}

// Format: randomKey.deleteKey.expiry.filename
func ParseFilename(filename string) (*ParsedFilename, error) {
	parts := strings.Split(filename, ".")
	if len(parts) < 4 {
		return nil, os.ErrInvalid
	}

	randomKey := parts[0]
	deleteKey := parts[1]
	expiryStr := parts[2]
	originalName := strings.Join(parts[3:], ".")

	expiryTimestamp, err := strconv.ParseInt(expiryStr, 10, 64)
	if err != nil {
		return nil, err
	}

	return &ParsedFilename{
		OriginalName:    originalName,
		RandomKey:       randomKey,
		DeleteKey:       deleteKey,
		ExpiryTimestamp: expiryTimestamp,
	}, nil
}

func buildFilename(randomKey, deleteKey string, expiryTimestamp int64, filename string) string {
	expiryStr := strconv.FormatInt(expiryTimestamp, 10)
	return randomKey + "." + deleteKey + "." + expiryStr + "." + filename
}

func (b *LocalfsBackend) Put(randomKey, deleteKey string, expiryTimestamp int64, filename string, reader io.Reader) (string, error) {
	diskFilename := buildFilename(randomKey, deleteKey, expiryTimestamp, filename)
	filePath := filepath.Join(b.filesPath, diskFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}

	success := false
	defer func() {
		dst.Close()
		if !success {
			os.Remove(filePath)
		}
	}()

	_, err = io.Copy(dst, reader)
	if err != nil {
		return "", err
	}

	err = dst.Close()
	if err != nil {
		return "", err
	}

	success = true
	return diskFilename, nil
}

func (b *LocalfsBackend) PutWithSizeCheck(randomKey, deleteKey string, expiryTimestamp int64, filename string, reader io.Reader, maxSize int64) (int64, error) {
	diskFilename := buildFilename(randomKey, deleteKey, expiryTimestamp, filename)
	filePath := filepath.Join(b.filesPath, diskFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}

	success := false
	defer func() {
		dst.Close()
		if !success {
			os.Remove(filePath)
		}
	}()

	buffer := make([]byte, 64*1024)
	var totalWritten int64

	for {
		nr, er := reader.Read(buffer)
		if nr > 0 {
			nw, ew := dst.Write(buffer[0:nr])
			if nw < 0 || nr < nw {
				nw = 0
				if ew == nil {
					ew = errors.New("invalid write result")
				}
			}
			totalWritten += int64(nw)
			if ew != nil {
				err = ew
				break
			}
			if maxSize > 0 && totalWritten > maxSize {
				return totalWritten, errors.New("file too large")
			}
		}
		if er != nil {
			if er != io.EOF {
				err = er
			}
			break
		}
	}

	if err != nil {
		return totalWritten, err
	}

	if totalWritten == 0 {
		return 0, errors.New("file is empty")
	}

	err = dst.Close()
	if err != nil {
		return totalWritten, err
	}

	success = true
	return totalWritten, nil
}

// Format: randomKey.deleteKey.expiry.tmp
func (b *LocalfsBackend) CreateTempFile(randomKey, deleteKey string) (io.WriteCloser, string, error) {
	expiryTimestamp := time.Now().Add(24 * time.Hour).Unix()
	expiryStr := strconv.FormatInt(expiryTimestamp, 10)
	tempFilename := randomKey + "." + deleteKey + "." + expiryStr + ".tmp"
	filePath := filepath.Join(b.filesPath, tempFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, "", err
	}

	return &TempFileWriter{
		file:      dst,
		filePath:  filePath,
		randomKey: randomKey,
		deleteKey: deleteKey,
		filesPath: b.filesPath,
	}, tempFilename, nil
}

type TempFileWriter struct {
	file      *os.File
	filePath  string
	randomKey string
	deleteKey string
	filesPath string
	closed    bool
}

func (tw *TempFileWriter) Write(p []byte) (n int, err error) {
	return tw.file.Write(p)
}

func (tw *TempFileWriter) Close() error {
	if tw.closed {
		return nil
	}
	tw.closed = true
	return tw.file.Close()
}

func (tw *TempFileWriter) RenameToFinal(expiryTimestamp int64, filename string) error {
	if !tw.closed {
		tw.file.Close()
		tw.closed = true
	}

	finalFilename := buildFilename(tw.randomKey, tw.deleteKey, expiryTimestamp, filename)
	finalPath := filepath.Join(tw.filesPath, finalFilename)

	err := os.Rename(tw.filePath, finalPath)
	if err != nil {
		os.Remove(tw.filePath)
		return err
	}

	return nil
}

func (tw *TempFileWriter) Abort() error {
	if !tw.closed {
		tw.file.Close()
		tw.closed = true
	}
	return os.Remove(tw.filePath)
}

func (b *LocalfsBackend) FindByPattern(pattern string) (string, error) {
	fullPattern := filepath.Join(b.filesPath, pattern)
	matches, err := filepath.Glob(fullPattern)
	if err != nil {
		return "", err
	}

	if len(matches) == 0 {
		return "", os.ErrNotExist
	}

	return filepath.Base(matches[0]), nil
}

func (b *LocalfsBackend) Get(filename string) (io.ReadCloser, error) {
	filePath := filepath.Join(b.filesPath, filename)
	return os.Open(filePath)
}

func (b *LocalfsBackend) Delete(filename string) error {
	filePath := filepath.Join(b.filesPath, filename)
	if _, err := os.Stat(filePath); err != nil {
		if os.IsNotExist(err) {
			return os.ErrNotExist
		}
		return err
	}

	return os.Remove(filePath)
}

func (b *LocalfsBackend) Exists(filename string) bool {
	filePath := filepath.Join(b.filesPath, filename)
	_, err := os.Stat(filePath)
	return err == nil
}

func (b *LocalfsBackend) ServeFile(filename string, w http.ResponseWriter, r *http.Request) error {
	filePath := filepath.Join(b.filesPath, filename)
	http.ServeFile(w, r, filePath)
	return nil
}
