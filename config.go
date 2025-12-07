package main

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
	Config.bind = "0.0.0.0:8080"
	Config.filesDir = "files/"
	Config.sitePath = "/"
	Config.siteName = "linx-minx"
	Config.maxSize = 16 * 1024 * 1024 * 1024
	Config.maxExpiry = 0
	Config.cleanupEveryMinutes = 60
	Config.keyLength = 16
}
