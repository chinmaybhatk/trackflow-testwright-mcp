import { test, expect } from '@playwright/test';

test.describe('TrackFlow Basic Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/TrackFlow|Frappe|ERPNext/);
    await expect(page.locator('input[type="email"], input[name="usr"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="pwd"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login credentials
    await page.fill('input[type="email"], input[name="usr"]', process.env.FRAPPE_USER || 'administrator');
    await page.fill('input[type="password"], input[name="pwd"]', process.env.FRAPPE_PASSWORD || 'admin');
    
    // Submit login
    await page.click('button[type="submit"], .btn-login');
    
    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    
    // Verify login success
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('should access a Frappe DocType', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="usr"]', process.env.FRAPPE_USER || 'administrator');
    await page.fill('input[type="password"], input[name="pwd"]', process.env.FRAPPE_PASSWORD || 'admin');
    await page.click('button[type="submit"], .btn-login');
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    
    // Navigate to a DocType list (adjust based on your DocTypes)
    await page.goto('/app/user');
    await expect(page.locator('.list-row')).toBeVisible();
  });
});