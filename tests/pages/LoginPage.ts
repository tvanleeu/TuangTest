import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Update these selectors to match the actual site's login form
    this.usernameInput = page.locator('input[name="username"], input[type="text"], input[id*="user"], input[placeholder*="username" i], input[placeholder*="email" i]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
    this.errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"]').first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }
}
