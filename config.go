package main

import "flag"

var Config struct {
	bind                string
	filesDir            string
	sitePath            string
	siteName            string
	maxSize             int64
	maxExpiry           uint64
	cleanupEveryMinutes uint64
	keyLength           int
}

func init() {
	flag.StringVar(&Config.bind, "bind", "0.0.0.0:8080", "address:port to bind")
	flag.StringVar(&Config.filesDir, "filespath", "files/", "path to files directory")
	flag.StringVar(&Config.sitePath, "sitepath", "/", "URL path prefix")
	flag.StringVar(&Config.siteName, "sitename", "linx-minx", "site name")
	flag.Int64Var(&Config.maxSize, "maxsize", 16*1024*1024*1024, "max file size in bytes")
	flag.Uint64Var(&Config.maxExpiry, "maxexpiry", 0, "max expiry in seconds (0=unlimited)")
	flag.Uint64Var(&Config.cleanupEveryMinutes, "cleanup", 60, "cleanup interval in minutes")
	flag.IntVar(&Config.keyLength, "keylen", 16, "random key length in URLs")
}
