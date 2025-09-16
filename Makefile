# OATHeadless Build Makefile

# Variables
CLIENT_DIR = client
SERVER_DIR = server
DIST_DIR = dist

# Default target
.PHONY: all
all: build

# Install all dependencies
.PHONY: install
install: install-client install-server

.PHONY: install-client
install-client:
	cd $(CLIENT_DIR) && npm install

.PHONY: install-server
install-server:
	cd $(SERVER_DIR) && pip install -r requirements.txt

# Development servers
.PHONY: dev
dev:
	@echo "Start client: make dev-client"
	@echo "Start server: make dev-server"

.PHONY: dev-client
dev-client: install-client
	cd $(CLIENT_DIR) && npm start

.PHONY: dev-server
dev-server: install-server
	cd $(SERVER_DIR) && python app.py

# Build production bundle
.PHONY: build
build: build-client

.PHONY: build-client
build-client: install-client
	cd $(CLIENT_DIR) && npm run build --configuration=production

# Package application
.PHONY: package
package: build-client
	@echo "Creating application bundle..."
	mkdir -p $(DIST_DIR)
	cp -r $(CLIENT_DIR)/dist/oatheadless $(DIST_DIR)/client
	cp -r $(SERVER_DIR) $(DIST_DIR)/server
	cd $(DIST_DIR) && tar -czf oatheadless-bundle.tar.gz client/ server/
	@echo "Bundle created: $(DIST_DIR)/oatheadless-bundle.tar.gz"

# Testing
.PHONY: test
test: test-client test-server

.PHONY: test-client
test-client: install-client
	cd $(CLIENT_DIR) && npm test

.PHONY: test-server
test-server: install-server
	cd $(SERVER_DIR) && python -m pytest mount/test_*.py -v

# Code quality
.PHONY: lint
lint: install-client
	cd $(CLIENT_DIR) && npm run lint

.PHONY: format
format: install-client
	cd $(CLIENT_DIR) && npm run format

# Clean
.PHONY: clean
clean:
	rm -rf $(DIST_DIR)
	rm -rf $(CLIENT_DIR)/dist
	rm -rf $(CLIENT_DIR)/.angular

.PHONY: clean-all
clean-all: clean
	rm -rf $(CLIENT_DIR)/node_modules

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install      - Install all dependencies"
	@echo "  dev-client   - Start Angular development server"
	@echo "  dev-server   - Start Flask development server"
	@echo "  build        - Build client application"
	@echo "  package      - Create complete application bundle"
	@echo "  test         - Run all tests"
	@echo "  test-client  - Run client tests"
	@echo "  test-server  - Run server tests"
	@echo "  lint         - Run client linter"
	@echo "  format       - Format client code"
	@echo "  clean        - Clean build artifacts"
	@echo "  clean-all    - Clean everything including dependencies"
	@echo "  help         - Show this help"
