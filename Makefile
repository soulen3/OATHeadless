# OATHeadless Build Makefile

# Variables
CLIENT_DIR = client
SERVER_DIR = server
DIST_DIR = dist
VENV_DIR = $(SERVER_DIR)/venv
PYTHON = ./venv/bin/python
PIP = $(VENV_DIR)/bin/pip

# Check for package managers
NPM := $(shell command -v npm 2> /dev/null)
YARN := $(shell command -v yarn 2> /dev/null)
PNPM := $(shell command -v pnpm 2> /dev/null)

# Default target
.PHONY: all
all: build

# Create virtual environment
.PHONY: venv
venv:
	cd $(SERVER_DIR) && python3 -m venv venv
	$(PIP) install --upgrade pip

# Install all dependencies
.PHONY: install
install: install-client install-server

.PHONY: install-client
install-client:
ifdef NPM
	cd $(CLIENT_DIR) && npm install
else ifdef YARN
	cd $(CLIENT_DIR) && yarn install
else ifdef PNPM
	cd $(CLIENT_DIR) && pnpm install
else
	@echo "Error: No package manager found (npm, yarn, or pnpm required)"
	@exit 1
endif

.PHONY: install-server
install-server: venv
	$(PIP) install -r $(SERVER_DIR)/requirements.txt

# Development servers
.PHONY: dev
dev:
	@echo "Start client: make dev-client"
	@echo "Start server: make dev-server"

.PHONY: dev-client
dev-client: install-client
ifdef NPM
	cd $(CLIENT_DIR) && npm start
else ifdef YARN
	cd $(CLIENT_DIR) && yarn start
else ifdef PNPM
	cd $(CLIENT_DIR) && pnpm start
else
	@echo "Error: No package manager found"
	@exit 1
endif

.PHONY: dev-server
dev-server: install-server
	cd $(SERVER_DIR) &&  ./venv/bin/flask run

# Build production bundle
.PHONY: build
build: build-client

.PHONY: build-client
build-client: install-client
ifdef NPM
	cd $(CLIENT_DIR) && ng build --configuration=production
else ifdef YARN
	cd $(CLIENT_DIR) && yarn build --configuration=production
else ifdef PNPM
	cd $(CLIENT_DIR) && pnpm build --configuration=production
else
	@echo "Error: No package manager found"
	@exit 1
endif

# Deploy client files to Flask static directory
.PHONY: deploy-client
deploy-client: build-client
	@echo "Deploying client files to Flask static directory..."
	mkdir -p $(SERVER_DIR)/static/
	cp $(CLIENT_DIR)/dist/oatheadless/* $(SERVER_DIR)/static/
	@echo "Client files deployed to $(SERVER_DIR)/static/"

# Manual build (if Angular CLI is available globally)
.PHONY: build-manual
build-manual:
	cd $(CLIENT_DIR) && ng build --configuration=production

# Package application
.PHONY: package
package: deploy-client
	@echo "Creating application bundle..."
	mkdir -p $(DIST_DIR)
	tar -czf $(DIST_DIR)/oatheadless-bundle.tar.gz --exclude='./venv' server/
	@echo "Bundle created: $(DIST_DIR)/oatheadless-bundle.tar.gz"
	@echo "Contains: Flask server + static client files"

# Package server only
.PHONY: package-server
package-server: install-server
	@echo "Creating server-only bundle..."
	mkdir -p $(DIST_DIR)
	cp -r $(SERVER_DIR) $(DIST_DIR)/server
	cd $(DIST_DIR) && tar -czf oatheadless-server.tar.gz server/
	@echo "Server bundle created: $(DIST_DIR)/oatheadless-server.tar.gz"

# Testing
.PHONY: test
test: test-server

.PHONY: test-server
test-server: install-server
	cd $(SERVER_DIR) && $(PYTHON) -m pytest mount/test_*.py -v

# Check system
.PHONY: check
check:
	@echo "Checking system requirements..."
	@echo -n "Python: "; python3 --version 2>/dev/null || echo "Not found"
	@echo -n "Node.js: "; node --version 2>/dev/null || echo "Not found"
	@echo -n "npm: "; npm --version 2>/dev/null || echo "Not found"
	@echo -n "yarn: "; yarn --version 2>/dev/null || echo "Not found"
	@echo -n "pnpm: "; pnpm --version 2>/dev/null || echo "Not found"
	@echo -n "Angular CLI: "; ng version |awk -F: '/Angular CLI/ {print $$2}' 2>/dev/null || echo "Not found"
	@echo -n "Virtual env: "; test -d $(VENV_DIR) && echo "Created" || echo "Not created"

# Clean
.PHONY: clean
clean:
	rm -rf $(DIST_DIR)
	rm -rf $(CLIENT_DIR)/dist
	rm -rf $(CLIENT_DIR)/.angular
	rm -rf $(SERVER_DIR)/static

.PHONY: clean-all
clean-all: clean
	rm -rf $(CLIENT_DIR)/node_modules
	rm -rf $(VENV_DIR)

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  venv           - Create Python virtual environment"
	@echo "  install        - Install all dependencies"
	@echo "  dev-client     - Start Angular development server"
	@echo "  dev-server     - Start Flask development server"
	@echo "  build          - Build client application"
	@echo "  deploy-client  - Deploy client files to Flask static directory"
	@echo "  build-manual   - Build using global Angular CLI"
	@echo "  package        - Create complete application bundle"
	@echo "  package-server - Create server-only bundle"
	@echo "  test-server    - Run server tests"
	@echo "  check          - Check system requirements"
	@echo "  clean          - Clean build artifacts"
	@echo "  clean-all      - Clean everything including venv"
	@echo "  help           - Show this help"
	@echo ""
	@echo "Virtual environment will be created at: $(VENV_DIR)"
