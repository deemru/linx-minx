# Linx-Minx

A lightweight file sharing server, inspired by [andreimarcu/linx-server](https://github.com/andreimarcu/linx-server).

## Features

- Drag & drop, click, paste upload
- Parallel uploads (up to 5 concurrent)
- Cyrillic filename transliteration
- File expiry with automatic cleanup
- No external JS dependencies

## Quick Start

```bash
go build -o linx-minx .
./linx-minx
```

Server runs on `0.0.0.0:8080`. Files are stored in `./files/`.

## CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-bind` | `0.0.0.0:8080` | Address:port to bind |
| `-filespath` | `files/` | Files storage directory |
| `-sitepath` | `/` | URL path prefix |
| `-sitename` | `linx-minx` | Site name |
| `-maxsize` | `17179869184` | Max file size (bytes) |
| `-maxexpiry` | `0` | Max expiry (seconds, 0=unlimited) |
| `-cleanup` | `60` | Cleanup interval (minutes) |
| `-keylen` | `16` | Random key length in URLs |

Example:

```bash
./linx-minx -bind 127.0.0.1:9000 -filespath /var/lib/linx-minx
```

## Testing

Requires Node.js and Chromium (for Playwright E2E tests):

```bash
make deps   # install playwright + chromium
make test   # build, start server, run 47 E2E tests
```

## URL Routes

| Route | Description |
|-------|-------------|
| `/` | Upload page |
| `/f/<key>/<name>` | File display page |
| `/d/<key>/<name>` | Raw download (attachment) |
| `/v/<key>/<name>` | Inline view |

## License

See [LICENSE](LICENSE).
