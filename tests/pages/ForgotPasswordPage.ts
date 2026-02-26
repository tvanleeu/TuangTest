import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE              = 'https://staging.finchoice.mobi/uat1';
const SCREENSHOT_DIR    = 'LoginForgotPWDResult';

export class ForgotPasswordPage {
  readonly page: Page;

  // ── Login page ──────────────────────────────────────────────────────────
  // Login redirects: /uat1/Reloan/CustomerLanding → /uat1/Account/Login
  readonly forgotPasswordLink: Locator;   // "Forgot Password" link on the login page

  // ── Forgot Password page ─────────────────────────────────────────────────
  // /uat1/ForgotPassword
  readonly cellNumberInput: Locator;   // id="txtCellNumber"  name="MobileNumber"
  readonly idNumberInput:   Locator;   // id="txtIDNumber"    name="IdNumber"
  readonly nextButton:      Locator;   // button[type="submit"] text "Next"
  readonly backToLoginLink: Locator;   // <a href="/uat1/login">Back</a>
  readonly errorMessage:    Locator;   // validation / server error
  readonly successMessage:  Locator;   // reset-link sent confirmation

  constructor(page: Page) {
    this.page = page;

    // Login page selectors
    this.forgotPasswordLink = page.locator('a[href*="ForgotPassword"]').first();

    // Forgot Password page selectors (exact ids/names from live DOM inspection)
    this.cellNumberInput = page.locator('#txtCellNumber');
    this.idNumberInput   = page.locator('#txtIDNumber');
    this.nextButton      = page.locator('button[type="submit"]:has-text("Next")');
    this.backToLoginLink = page.locator('a[href*="/uat1/login"], a:has-text("Back")').first();

    // Server-side / inline validation feedback
    this.errorMessage = page.locator(
      '.validation-summary-errors, ' +
      '[data-valmsg-for], ' +
      '.field-validation-error, ' +
      '[class*="error" i]:not(script), ' +
      '[role="alert"]'
    ).first();

    this.successMessage = page.locator(
      '[class*="success" i], ' +
      'p:has-text("sent"), p:has-text("reset"), ' +
      'div:has-text("reset link"), ' +
      '.alert-success'
    ).first();
  }

  /** Navigate to the app login page */
  async gotoLogin() {
    await this.page.goto(BASE + '/Reloan/CustomerLanding');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Navigate directly to the Forgot Password page */
  async gotoForgotPassword() {
    await this.page.goto(BASE + '/ForgotPassword');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Save a full-page screenshot to LoginForgotPWDResult/ */
  async screenshot(testId: string, step: string) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const filename = path.join(SCREENSHOT_DIR, `${testId}-${step}.png`);
    await this.page.screenshot({ path: filename, fullPage: true });
  }
}
