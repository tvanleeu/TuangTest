import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class RegisterPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  // Scoped to the register form so we never accidentally hit the search button
  readonly submitButton: Locator;
  readonly form: Locator;
  readonly errorMessages: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('form#create_customer');
    // Use attribute selectors to avoid matching wrapper <div> elements that share the same id
    this.firstNameInput = page.locator('input[name="customer[first_name]"]');
    this.lastNameInput = page.locator('input[name="customer[last_name]"]');
    this.emailInput = page.locator('input[name="customer[email]"]');
    this.passwordInput = page.locator('input[name="customer[password]"]');
    this.submitButton = this.form.locator('input[type="submit"]');
    // Shopify older-theme error container
    this.errorMessages = page.locator('.errors, .notice--error, [class*="error_message"]');
    this.signInLink = page.locator('a[href*="login"], a[href*="sign_in"]').first();
  }

  async goto() {
    await this.page.goto('https://sauce-demo.myshopify.com/account/register');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Submit the form via native HTMLFormElement.submit() to bypass
   * Shopify's `data-login-with-shop-sign-up` JS interceptor.
   */
  async submitForm() {
    await this.page.evaluate(() => {
      const form = document.querySelector('form#create_customer') as HTMLFormElement;
      form.submit();
    });
  }

  async screenshot(testId: string, step: string) {
    const dir = path.join('test-results', 'screenshots');
    fs.mkdirSync(dir, { recursive: true });
    await this.page.screenshot({
      path: path.join(dir, `${testId}-${step}.png`),
      fullPage: true,
    });
  }
}
