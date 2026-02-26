/**
 * Forgot Password Test Suite
 * Source: Login-forgot password.csv
 *
 * TC_FP_002 – "Forgot Password" link navigates to the correct page
 * TC_FP_003 – Successful submission with a valid registered cell/ID
 * TC_FP_004 – Error message with an unregistered cell/ID
 * TC_FP_005 – Error when submitting empty fields
 * TC_FP_007 – "Back to Login" navigation
 *
 * Screenshots → LoginForgotPWDResult/
 */

import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// ---------------------------------------------------------------------------
// Test data
// VALID_CELL / VALID_ID  ← MUST be updated to a real registered UAT1 account.
//   TC_FP_003 will auto-skip while these still hold the placeholder values.
// INVALID_*              ← deliberately non-existent (triggers error flow)
// ---------------------------------------------------------------------------
const VALID_CELL   = process.env.FP_VALID_CELL   ?? 'PLACEHOLDER_CELL';
const VALID_ID     = process.env.FP_VALID_ID     ?? 'PLACEHOLDER_ID';
const INVALID_CELL = '0899999999';    // NOT registered (valid format)
const INVALID_ID   = '9999999999999'; // NOT registered (invalid SA ID format → inline error)

const BASE_URL = 'https://staging.finchoice.mobi/uat1';

// ---------------------------------------------------------------------------
test.describe('Forgot Password Flow – finchoice.mobi UAT1', () => {
  let fp: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    fp = new ForgotPasswordPage(page);
  });

  // ─── TC_FP_002 ────────────────────────────────────────────────────────────
  test('TC_FP_002 – "Forgot Password" link navigates to Forgot Password page', async ({ page }) => {
    // Precondition: on the Login page
    await fp.gotoLogin();
    await fp.screenshot('TC_FP_002', '01-login-page');

    // The login page redirects to /Account/Login — "Forgot Password" link is present
    await fp.forgotPasswordLink.waitFor({ state: 'visible', timeout: 15_000 });
    await fp.screenshot('TC_FP_002', '02-forgot-link-visible');

    await fp.forgotPasswordLink.click();
    await page.waitForLoadState('domcontentloaded');
    await fp.screenshot('TC_FP_002', '03-after-click-forgot-link');

    // Verify URL
    expect(page.url().toLowerCase()).toContain('forgotpassword');

    // Verify both form fields are visible
    await expect(fp.cellNumberInput).toBeVisible({ timeout: 10_000 });
    await expect(fp.idNumberInput).toBeVisible({ timeout: 10_000 });

    await fp.screenshot('TC_FP_002', '04-forgot-password-fields-visible');
  });

  // ─── TC_FP_003 ────────────────────────────────────────────────────────────
  // To run this test, set FP_VALID_CELL and FP_VALID_ID env vars (or update
  // the .env file) to a real registered account on the UAT1 environment.
  test('TC_FP_003 – Successful submission with valid registered cell/ID', async ({ page }) => {
    test.skip(
      VALID_CELL === 'PLACEHOLDER_CELL',
      'Skipped: set FP_VALID_CELL and FP_VALID_ID env vars to a real UAT1 registered account'
    );

    await fp.gotoForgotPassword();
    await fp.screenshot('TC_FP_003', '01-forgot-password-page');

    await fp.cellNumberInput.waitFor({ state: 'visible', timeout: 10_000 });
    await fp.cellNumberInput.fill(VALID_CELL);
    await fp.idNumberInput.fill(VALID_ID);
    await fp.screenshot('TC_FP_003', '02-fields-filled');

    await fp.nextButton.click();
    await page.waitForLoadState('domcontentloaded');
    await fp.screenshot('TC_FP_003', '03-after-submit');

    // Expect a success/confirmation message
    await expect(fp.successMessage).toBeVisible({ timeout: 15_000 });
    await fp.screenshot('TC_FP_003', '04-success-message');
  });

  // ─── TC_FP_004 ────────────────────────────────────────────────────────────
  test('TC_FP_004 – Error message with unregistered cell/ID', async ({ page }) => {
    await fp.gotoForgotPassword();
    await fp.screenshot('TC_FP_004', '01-forgot-password-page');

    await fp.cellNumberInput.waitFor({ state: 'visible', timeout: 10_000 });
    await fp.cellNumberInput.fill(INVALID_CELL);
    await fp.idNumberInput.fill(INVALID_ID);
    await fp.screenshot('TC_FP_004', '02-fields-filled-invalid');

    await fp.nextButton.click();
    await page.waitForLoadState('domcontentloaded');
    await fp.screenshot('TC_FP_004', '03-after-submit');

    // Expect an error/not-found message
    await expect(fp.errorMessage).toBeVisible({ timeout: 10_000 });
    await fp.screenshot('TC_FP_004', '04-error-message');
  });

  // ─── TC_FP_005 ────────────────────────────────────────────────────────────
  test('TC_FP_005 – Validation error when submitting empty fields', async ({ page }) => {
    await fp.gotoForgotPassword();
    await fp.screenshot('TC_FP_005', '01-forgot-password-page');

    // Leave both fields empty and click Next
    await fp.nextButton.waitFor({ state: 'visible', timeout: 10_000 });
    await fp.screenshot('TC_FP_005', '02-fields-empty');

    await fp.nextButton.click();
    // Small wait for client-side validation to render
    await page.waitForTimeout(1_000);
    await fp.screenshot('TC_FP_005', '03-after-submit');

    // Expect a validation message and that we remain on the ForgotPassword page
    await expect(fp.errorMessage).toBeVisible({ timeout: 10_000 });
    expect(page.url().toLowerCase()).toContain('forgotpassword');

    await fp.screenshot('TC_FP_005', '04-validation-error-shown');
  });

  // ─── TC_FP_007 ────────────────────────────────────────────────────────────
  test('TC_FP_007 – "Back" link navigates back to Login page', async ({ page }) => {
    await fp.gotoForgotPassword();
    await fp.screenshot('TC_FP_007', '01-forgot-password-page');

    // "Back" link → /uat1/login
    await fp.backToLoginLink.waitFor({ state: 'visible', timeout: 10_000 });
    await fp.screenshot('TC_FP_007', '02-back-link-visible');

    await fp.backToLoginLink.click();
    await page.waitForLoadState('domcontentloaded');
    await fp.screenshot('TC_FP_007', '03-after-back-click');

    // Should land on the login page (Account/Login or /login)
    const url = page.url().toLowerCase();
    const onLoginPage =
      url.includes('/account/login') ||
      url.includes('/uat1/login')    ||
      url.endsWith('/login');

    expect(onLoginPage).toBeTruthy();
    await fp.screenshot('TC_FP_007', '04-login-page-confirmed');
  });
});
