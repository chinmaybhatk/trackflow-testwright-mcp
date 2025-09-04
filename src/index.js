import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestWrightFrappeServer {
  constructor() {
    this.server = new Server(
      {
        name: 'testwright-frappe',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'run_playwright_test',
          description: 'Run a Playwright test against the Frappe application',
          inputSchema: {
            type: 'object',
            properties: {
              testName: { type: 'string', description: 'Name of the test' },
              url: { type: 'string', description: 'URL of the Frappe application' },
              testCode: { type: 'string', description: 'Playwright test code to execute' },
              headless: { type: 'boolean', description: 'Run in headless mode', default: true }
            },
            required: ['testName', 'url', 'testCode']
          }
        },
        {
          name: 'create_test_file',
          description: 'Create a new test file for Frappe testing',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: { type: 'string', description: 'Name of the test file' },
              testContent: { type: 'string', description: 'Content of the test file' }
            },
            required: ['fileName', 'testContent']
          }
        },
        {
          name: 'frappe_login',
          description: 'Login to Frappe application',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Frappe application URL' },
              username: { type: 'string', description: 'Username' },
              password: { type: 'string', description: 'Password' }
            },
            required: ['url', 'username', 'password']
          }
        },
        {
          name: 'frappe_api_call',
          description: 'Make API call to Frappe',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Frappe application URL' },
              method: { type: 'string', description: 'HTTP method', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
              endpoint: { type: 'string', description: 'API endpoint' },
              data: { type: 'object', description: 'Request data' },
              cookies: { type: 'string', description: 'Session cookies' }
            },
            required: ['url', 'method', 'endpoint']
          }
        },
        {
          name: 'run_test_suite',
          description: 'Run all tests in the test directory',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'Test file pattern', default: '*.spec.js' },
              headless: { type: 'boolean', description: 'Run in headless mode', default: true }
            }
          }
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'run_playwright_test':
          return await this.runPlaywrightTest(args);
        case 'create_test_file':
          return await this.createTestFile(args);
        case 'frappe_login':
          return await this.frappeLogin(args);
        case 'frappe_api_call':
          return await this.frappeApiCall(args);
        case 'run_test_suite':
          return await this.runTestSuite(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async runPlaywrightTest({ testName, url, testCode, headless = true }) {
    try {
      const browser = await chromium.launch({ headless });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url);

      // Create a function from the test code and execute it
      const testFunction = new Function('page', 'expect', testCode);
      const expect = (actual) => ({
        toBe: (expected) => {
          if (actual !== expected) {
            throw new Error(`Expected ${expected} but got ${actual}`);
          }
        },
        toContain: (expected) => {
          if (!actual.includes(expected)) {
            throw new Error(`Expected to contain ${expected}`);
          }
        }
      });

      await testFunction(page, expect);

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: `✓ Test "${testName}" passed successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `✗ Test "${testName}" failed:\n${error.message}\n${error.stack}`,
          },
        ],
      };
    }
  }

  async createTestFile({ fileName, testContent }) {
    try {
      const testsDir = path.join(__dirname, '..', 'tests');
      await fs.mkdir(testsDir, { recursive: true });
      
      const filePath = path.join(testsDir, fileName);
      await fs.writeFile(filePath, testContent);
      
      return {
        content: [
          {
            type: 'text',
            text: `Test file ${fileName} created successfully at ${filePath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create test file: ${error.message}`,
          },
        ],
      };
    }
  }

  async frappeLogin({ url, username, password }) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${url}/login`);
      
      // Fill login form
      await page.fill('input[name="usr"], input[type="email"]', username);
      await page.fill('input[name="pwd"], input[type="password"]', password);
      
      // Click login button
      await page.click('button[type="submit"], .btn-login');
      
      // Wait for navigation
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      
      // Get cookies
      const cookies = await context.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      await browser.close();
      
      return {
        content: [
          {
            type: 'text',
            text: `Login successful. Session cookies: ${cookieString}`,
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `Login failed: ${error.message}`,
          },
        ],
      };
    }
  }

  async frappeApiCall({ url, method, endpoint, data = {}, cookies = '' }) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Set cookies if provided
      if (cookies) {
        const cookieArray = cookies.split('; ').map(cookie => {
          const [name, value] = cookie.split('=');
          return { name, value, domain: new URL(url).hostname, path: '/' };
        });
        await context.addCookies(cookieArray);
      }

      // Navigate to the URL
      await page.goto(url);

      // Make API call
      const response = await page.evaluate(async ({ endpoint, method, data }) => {
        const res = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token || ''
          },
          body: method !== 'GET' ? JSON.stringify(data) : undefined,
          credentials: 'include'
        });
        
        const responseData = await res.json();
        return {
          status: res.status,
          data: responseData
        };
      }, { endpoint: `${url}${endpoint}`, method, data });

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      await browser.close();
      return {
        content: [
          {
            type: 'text',
            text: `API call failed: ${error.message}`,
          },
        ],
      };
    }
  }

  async runTestSuite({ pattern = '*.spec.js', headless = true }) {
    try {
      const { execSync } = await import('child_process');
      const result = execSync(`npx playwright test tests/${pattern} ${headless ? '' : '--headed'}`, {
        encoding: 'utf8'
      });
      
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Test suite failed:\n${error.message}\n${error.stdout || ''}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TestWright-Frappe MCP Server running...');
  }
}

// Start the server
const server = new TestWrightFrappeServer();
server.run().catch(console.error);