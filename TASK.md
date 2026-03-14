# TASK: Replace Dropzone.js with custom upload engine

## Overview
Replace `dropzone-minx.js` (1824 lines, Dropzone v5.7.0 fork) with lightweight `upload-engine.js` (~100 lines).

## Server Info
- Go project, build: `go build -o linx-minx .`
- Port is hardcoded in `config.go` as `Config.bind = "0.0.0.0:8080"`
- Port 8080 is OCCUPIED on this machine. For tests, change config.go bind to `127.0.0.1:8090` before building, then restore after.
- Run: `./linx-minx` (creates `files/` dir automatically)
- Upload: `POST /upload` multipart, returns JSON `{furl, size, expiry, dkey}`
- Delete: `DELETE /<filename>` with header `dkey: <key>`
- Max file size from `data-maxsize` attribute on form element

## Repository
- Working dir: `/home/claw/.openclaw/workspace/linx-minx`
- Remote: `https://github.com/PiDmitrius/linx-minx.git` (private)
- DO NOT push. Only local commits.
- DO NOT commit build artifacts (linx-minx binary, node_modules, test-results, etc.)

## Phase 1: E2E Tests on Current Code (Dropzone)

### Setup
1. Create `package.json` with playwright dependency
2. Create `playwright.config.js` (baseURL: `http://127.0.0.1:8090`, chromium only, headless)
3. Create `.gitignore` with: `node_modules/`, `test-results/`, `playwright-report/`, `linx-minx` (binary), `files/`
4. `npm install && npx playwright install chromium --with-deps`

### Test Cases (14 tests in `tests/` dir)
Each test is a full cycle: action → verify in DOM + server.

1. **upload-dragdrop.spec.js** — Simulate file drop via `page.dispatchEvent` or `inputFile.setInputFiles`. File appears in `#uploads`, link works (GET → 200).
2. **upload-directory.spec.js** — Mock DataTransfer + webkitGetAsEntry for directory with 3 files. All 3 uploaded, 3 elements in `#uploads`.
3. **upload-click.spec.js** — Click `#dzone` → file chooser → setFiles. File uploaded, link in DOM.
4. **upload-paste.spec.js** — Dispatch paste event with clipboard containing image. File uploaded.
5. **upload-progress.spec.js** — During upload, `.upload` element contains percentage. After completion — link.
6. **upload-parallel.spec.js** — 10 files, route with 500ms delay. At any moment ≤5 active XHR. All 10 uploaded eventually.
7. **upload-cancel.spec.js** — Click ✕ during upload → XHR aborted, element gets strikethrough class.
8. **upload-delete.spec.js** — Click ✕ after upload → DELETE request, element strikethrough, GET → 404.
9. **upload-rename.spec.js** — File `Криптография тест.txt` → uploaded as `Cryptographiya_test.txt`.
10. **upload-maxsize.spec.js** — File > maxsize → error in UI, no XHR sent.
11. **upload-auth.spec.js** — Set `data-auth="basic"` via page.evaluate, mock `HEAD /auth` → verify HEAD called before upload.
12. **upload-storage.spec.js** — After upload, `localStorage.getItem("linx-minx-files")` has entry. After reload — file displayed.
13. **upload-download.spec.js** — Upload binary file (100 random bytes) → download via link → byte-for-byte match.
14. **upload-fallback.spec.js** — JS disabled → `.fallback` visible, `#dzone` hidden.

### Important Details for Tests
- The form element is `<form id="dropzone" class="dropzone">` with `data-maxsize` attribute (bytes)
- `data-auth="none"` by default (no auth check)
- Dropzone is initialized via `Dropzone.options.dropzone = {...}` in upload.js
- Files uploaded via drag-drop or click go through Dropzone's internal processing
- For drag-drop test: easiest approach is to use the hidden file input that Dropzone creates, or dispatch events on the form
- `#uploads` div receives upload elements
- Each upload element has class `upload`, contains file name span + actions div
- Cancel button has class `cancel` with text `✕`
- After successful upload, cancel button becomes delete button (same class `cancel`, same text `✕`)
- Strikethrough: class changes to `upload strikethrough`
- `renameFile` function: transliterates Cyrillic, `крипт` → `crypt`, replaces special chars, collapses multiple `_`
- Upload response JSON: `{"filename":"...","furl":"http://...","size":123,"expiry":86400,"dkey":"..."}`
- `parallelUploads: 5` in Dropzone config
- `maxFilesize` is in MB (Dropzone convention): `Math.round(parseInt(data-maxsize) / 1024 / 1024)`

### Run Tests
```bash
# Build server for tests (port 8090)
sed -i 's/0.0.0.0:8080/127.0.0.1:8090/' config.go
go build -o linx-minx .
sed -i 's/127.0.0.1:8090/0.0.0.0:8080/' config.go

# Start server
rm -rf files/
./linx-minx &
sleep 2

# Run tests
npx playwright test

# Stop server
kill %1
```

Commit: `git add -A && git status` (verify no artifacts!) then `git commit -m "e2e tests on current dropzone code"`

## Phase 2: Migration

### Create `static/js/upload-engine.js`
Lightweight upload engine (~80-120 lines). Architecture:

```
init(config) — initialize, subscribe to events
drag & drop — dragover/drop on document
click — hidden input + click handler on #dzone
addEntries(items) — webkitGetAsEntry, recursive directory traversal
addFile(file) — validation + add to queue
processQueue() — parallel upload (up to N slots)
uploadFile(file) — XHR + FormData + progress
cancelUpload(file) — abort XHR
```

Config callbacks:
- `onFileAdded(file)` — file added to queue
- `onProgress(file, percent, bytesSent)` — upload progress
- `onSuccess(file, response)` — upload complete
- `onError(file, message)` — error
- `onCanceled(file)` — upload canceled
- `onSending(file, xhr, formData)` — before sending (for adding expires etc)
- `renameFile(file)` — rename before upload

Config options:
- `dropzone` — element or selector for drop zone
- `url` — upload URL
- `maxFilesize` — max file size in bytes
- `parallelUploads` — max concurrent uploads (default 5)
- `headers` — extra headers (e.g. `{"Accept": "application/json"}`)
- `autoProcessQueue` — start immediately or wait (for auth check)

### Modify `static/js/upload.js`
- Remove `Dropzone.options.dropzone = { ... }` wrapper
- Initialize upload engine: `var engine = UploadEngine.init({...})`
- Move all callback logic to engine callbacks
- `document.onpaste` calls `engine.addFile()` instead of `Dropzone.forElement().addFile()`
- Keep `renameFile` (urlRusLat) function as-is

### Modify `templates/index.html`
- Replace `<script src="...dropzone-minx.js">` with `<script src="...upload-engine.js">`

### Delete `static/js/dropzone-minx.js`

### Run ALL tests — must be green!

Commit: `git commit -m "replace dropzone with upload-engine"`

## Phase 3: CI
Create `.github/workflows/e2e.yml`:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - run: |
          sed -i 's/0.0.0.0:8080/127.0.0.1:8090/' config.go
          go build -o linx-minx .
      - run: |
          ./linx-minx &
          sleep 2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            test-results/
            playwright-report/
```

Commit: `git commit -m "ci: e2e workflow"`

## Browser Compatibility
Target: 2017+ (ES2017). Use:
- `const`/`let`, arrow functions, `for...of`, `async`/`await`, template literals, spread, `Promise`

Do NOT use:
- Optional chaining `?.` (2020)
- Nullish coalescing `??` (2020)
- `globalThis` (2020)
- `Array.at()` (2022)

## Files NOT to Modify
- `static/js/storage.js`
- `static/js/expiry-buttons.js`
- `static/js/copy-link.js`
- `static/css/linx-minx-upload.css`
- Any Go files (except temporary config.go bind change for tests)

## CRITICAL
- After `git add`, ALWAYS run `git status` to verify no artifacts before committing
- Do NOT push to remote
- Do NOT leave server running after tests
- Clean up `files/` dir between test runs if needed
