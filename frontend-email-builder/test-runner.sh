#!/bin/bash

# Test Runner Script for Email Builder E2E Tests
# This script provides various ways to run the Playwright tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Email Builder E2E Test Runner ===${NC}\n"

# Function to display help
show_help() {
    echo "Usage: ./test-runner.sh [command]"
    echo ""
    echo "Commands:"
    echo "  all              Run all tests (default)"
    echo "  ui               Run tests in UI mode (interactive)"
    echo "  headed           Run tests with visible browser"
    echo "  debug            Run tests in debug mode"
    echo "  demo             Run visual demo tests only"
    echo "  drag-drop        Run drag & drop tests only"
    echo "  quick            Run quick smoke tests"
    echo "  ci               Run in CI mode"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./test-runner.sh all"
    echo "  ./test-runner.sh ui"
    echo "  ./test-runner.sh headed"
}

# Function to check if dev server is running
check_server() {
    echo -e "${YELLOW}Checking if dev server is running...${NC}"
    if curl -s http://localhost:5173 > /dev/null; then
        echo -e "${GREEN}✓ Dev server is running${NC}\n"
    else
        echo -e "${RED}✗ Dev server is not running${NC}"
        echo -e "${YELLOW}Please start the dev server with: npm run dev${NC}\n"
        exit 1
    fi
}

# Main command handling
case "${1:-all}" in
    all)
        echo -e "${GREEN}Running all tests...${NC}\n"
        npm run test:e2e
        ;;

    ui)
        echo -e "${GREEN}Starting Playwright UI mode...${NC}\n"
        npm run test:e2e:ui
        ;;

    headed)
        echo -e "${GREEN}Running tests in headed mode...${NC}\n"
        npm run test:e2e:headed
        ;;

    debug)
        echo -e "${GREEN}Starting debug mode...${NC}\n"
        npm run test:e2e:debug
        ;;

    demo)
        echo -e "${GREEN}Running visual demo tests...${NC}\n"
        npx playwright test e2e/visual-demo.spec.ts --headed --slow-mo=500
        ;;

    drag-drop)
        echo -e "${GREEN}Running drag & drop tests...${NC}\n"
        npx playwright test e2e/drag-and-drop.spec.ts
        ;;

    quick)
        echo -e "${GREEN}Running quick smoke tests...${NC}\n"
        npx playwright test e2e/drag-and-drop.spec.ts --grep "should drag.*from palette to canvas"
        ;;

    ci)
        echo -e "${GREEN}Running in CI mode...${NC}\n"
        CI=true npm run test:e2e
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        echo -e "${RED}Unknown command: $1${NC}\n"
        show_help
        exit 1
        ;;
esac

# Show results
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Tests completed successfully!${NC}"
    echo -e "${YELLOW}View HTML report: npx playwright show-report${NC}"
else
    echo -e "\n${RED}✗ Tests failed${NC}"
    exit 1
fi
