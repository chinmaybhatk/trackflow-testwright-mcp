# TrackFlow TestWright MCP Server

An MCP (Model Context Protocol) server that integrates TestWright (Playwright) with Frappe-based applications for automated testing.

## Features

- Run Playwright tests against Frappe applications
- Create and manage test files
- Authenticate with Frappe
- Make API calls to Frappe backend
- Run test suites

## Installation

1. Clone this repository:
```bash
git clone https://github.com/chinmaybhatk/trackflow-testwright-mcp.git
cd trackflow-testwright-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Usage

### As MCP Server

1. Start the MCP server:
```bash
npm start
```

2. Configure your MCP client (like Claude) to connect to this server.

### Running Tests Directly

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

## Available MCP Tools

### 1. `run_playwright_test`
Runs a single Playwright test against your Frappe application.

**Parameters:**
- `testName`: Name of the test
- `url`: URL of the Frappe application
- `testCode`: JavaScript code for the test
- `headless`: Whether to run in headless mode (default: true)

### 2. `create_test_file`
Creates a new test file in the tests directory.

**Parameters:**
- `fileName`: Name of the test file
- `testContent`: Content of the test file

### 3. `frappe_login`
Logs into a Frappe application and returns session cookies.

**Parameters:**
- `url`: Frappe application URL
- `username`: Username
- `password`: Password

### 4. `frappe_api_call`
Makes API calls to Frappe backend.

**Parameters:**
- `url`: Frappe application URL
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `endpoint`: API endpoint
- `data`: Request data (optional)
- `cookies`: Session cookies (optional)

### 5. `run_test_suite`
Runs all tests matching a pattern.

**Parameters:**
- `pattern`: Test file pattern (default: '*.spec.js')
- `headless`: Whether to run in headless mode (default: true)

## Environment Variables

- `FRAPPE_URL`: Base URL of your Frappe application (default: http://localhost:8000)
- `FRAPPE_USER`: Default username for tests
- `FRAPPE_PASSWORD`: Default password for tests

## Example Test

```javascript
import { test, expect } from '@playwright/test';

test('should create a new document', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="usr"]', 'administrator');
  await page.fill('input[name="pwd"]', 'admin');
  await page.click('button[type="submit"]');
  
  // Navigate to DocType
  await page.goto('/app/your-doctype');
  
  // Create new document
  await page.click('button:has-text("New")');
  await page.fill('input[name="field_name"]', 'Test Value');
  await page.click('button:has-text("Save")');
  
  // Verify
  await expect(page.locator('.toast-message')).toContainText('Saved');
});
```

## Integration with Claude

To use this MCP server with Claude:

1. Add the server configuration to your MCP settings
2. Claude can then use the tools to:
   - Write and execute tests
   - Debug test failures
   - Create test suites
   - Interact with your Frappe application

## License

MIT