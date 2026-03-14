.PHONY: build test e2e clean deps

build:
	go build -o linx-minx .

deps:
	npm install
	./node_modules/.bin/playwright install chromium --with-deps

test: build
	bash scripts/e2e.sh

e2e: test

clean:
	rm -f linx-minx
	rm -rf files/ test-results/ playwright-report/
