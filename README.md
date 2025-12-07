# linx-minx

A simplified file sharing server inspired by [andreimarcu/linx-server](https://github.com/andreimarcu/linx-server).

## Features

- File upload with drag & drop
- File display and download
- Automatic expiry and cleanup
- Simple, lightweight design

## Usage

```bash
go run .
```

Server runs on `0.0.0.0:8080` by default. Upload files via the web interface at `/`.

## Configuration

Edit `config.go` to customize:
- Bind address
- Files directory
- Max file size (default: 16GB)
- Expiry settings
- Cleanup interval
