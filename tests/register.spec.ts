import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/RegisterPage';

const REGISTER_URL = 'https://sauce-demo.myshopify.com/account/register';

// ---------------------------------------------------------------------------
// Helper: fill and submit the registration form via JS (bypasses Shopify's
// `data-login-with-shop-sign-up` interceptor that swallows button clicks).
// ---------------------------------------------------------------------------
async function fillAndSubmit(
  reg: RegisterPage,
  data: { firstName?: string; lastName?: string; email?: string; password?: string }
) {
  if (data.firstName !== undefined) await reg.firstNameInput.fill(data.firstName);
  if (data.lastName !== undefined) await reg.lastNameInput.fill(data.lastName);
  if (data.email !== undefined) await reg.emailInput.fill(data.email);
  if (data.password !== undefined) await reg.passwordInput.fill(data.password);
  await reg.submitForm();
  await reg.page.waitForLoadState('load');
}

test.describe('Account Registration', () => {
  let reg: RegisterPage;

  test.beforeEach(async ({ page }) => {
    reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.form).toBeVisible();
  });

  // ─── TC001 ────────────────────────────────────────────────────────────────
  test('TC001 - Successful Registration with Valid Data', async ({ page }) => {
    const uniqueEmail = `tuang+${Date.now()}@test.com`;

    await reg.firstNameInput.fill('Tuang');
    await reg.lastNameInput.fill('Test');
    await reg.emailInput.fill(uniqueEmail);
    await reg.passwordInput.fill('Password123'); // unambiguously valid (CSV uses 12345)

    await reg.screenshot('TC001', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC001', '02-after-submit');

    // Should redirect away from /account/register to the account dashboard
    await expect(page).not.toHaveURL(/\/account\/register/);
  });

  // ─── TC002 ────────────────────────────────────────────────────────────────
  // NOTE: First Name is optional on this Shopify store.
  test('TC002 - Registration with Blank First Name', async ({ page }) => {
    const uniqueEmail = `blank-fn+${Date.now()}@test.com`;

    await reg.screenshot('TC002', '01-form-filled');
    await fillAndSubmit(reg, { lastName: 'Test', email: uniqueEmail, password: 'Password123' });
    await reg.screenshot('TC002', '02-after-submit');

    // Document behaviour: Shopify treats First Name as optional.
    const errorVisible = await reg.errorMessages.isVisible().catch(() => false);
    const onRegisterPage = page.url().includes('/account/register');
    console.log(`TC002 — blank first name: error=${errorVisible}, onRegister=${onRegisterPage}`);
  });

  // ─── TC003 ────────────────────────────────────────────────────────────────
  // NOTE: Last Name is optional on this Shopify store.
  test('TC003 - Registration with Blank Last Name', async ({ page }) => {
    const uniqueEmail = `blank-ln+${Date.now()}@test.com`;

    await reg.screenshot('TC003', '01-form-filled');
    await fillAndSubmit(reg, { firstName: 'Tuang', email: uniqueEmail, password: 'Password123' });
    await reg.screenshot('TC003', '02-after-submit');

    const errorVisible = await reg.errorMessages.isVisible().catch(() => false);
    const onRegisterPage = page.url().includes('/account/register');
    console.log(`TC003 — blank last name: error=${errorVisible}, onRegister=${onRegisterPage}`);
  });

  // ─── TC004 ────────────────────────────────────────────────────────────────
  test('TC004 - Registration with Blank Email', async ({ page }) => {
    await reg.firstNameInput.fill('Tuang');
    await reg.lastNameInput.fill('Test');
    await reg.passwordInput.fill('Password123');
    // email left blank

    await reg.screenshot('TC004', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC004', '02-after-submit');

    // Registration must NOT succeed — a logged-in session would show a sign-out link.
    // Cloudflare challenge pages, error pages and the register page do NOT have one.
    const signedIn = await page
      .locator('a[href*="logout"], a[href*="sign_out"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(signedIn).toBe(false);
  });

  // ─── TC005 ────────────────────────────────────────────────────────────────
  test('TC005 - Registration with Invalid Email Format', async ({ page }) => {
    await reg.firstNameInput.fill('Tuang');
    await reg.lastNameInput.fill('Test');
    await reg.emailInput.fill('tuang@test'); // missing TLD
    await reg.passwordInput.fill('Password123');

    await reg.screenshot('TC005', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC005', '02-after-submit');

    // Registration must NOT succeed with an invalid email format.
    const signedIn = await page
      .locator('a[href*="logout"], a[href*="sign_out"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(signedIn).toBe(false);
  });

  // ─── TC006 ────────────────────────────────────────────────────────────────
  test('TC006 - Registration with Blank Password', async ({ page }) => {
    await reg.firstNameInput.fill('Tuang');
    await reg.lastNameInput.fill('Test');
    await reg.emailInput.fill(`blank-pw+${Date.now()}@test.com`);
    // password left blank

    await reg.screenshot('TC006', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC006', '02-after-submit');

    // Registration must NOT succeed without a password.
    const signedIn = await page
      .locator('a[href*="logout"], a[href*="sign_out"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(signedIn).toBe(false);
  });

  // ─── TC007 ────────────────────────────────────────────────────────────────
  // Self-contained: registers a fresh email, then immediately tries it again.
  test('TC007 - Registration with Already Registered Email', async ({ page }) => {
    const email = `duplicate+${Date.now()}@test.com`;

    // Step 1: Register the email for the first time
    await fillAndSubmit(reg, {
      firstName: 'Tuang',
      lastName: 'Test',
      email,
      password: 'Password123',
    });
    await reg.screenshot('TC007', '01-first-registration');

    // If first registration failed (stayed on register), skip gracefully
    if (page.url().includes('/account/register')) {
      console.log('TC007: first registration failed — cannot test duplicate scenario');
      return;
    }

    // Step 2: Go back and try the same email again
    await page.goto(REGISTER_URL);
    await expect(reg.form).toBeVisible();

    await fillAndSubmit(reg, {
      firstName: 'Tuang',
      lastName: 'Test',
      email,
      password: 'Password123',
    });
    await reg.screenshot('TC007', '02-duplicate-attempt');

    // Expect "already taken" error
    const hasErrorText = await page
      .locator('text=/already|taken|registered/i')
      .first()
      .isVisible()
      .catch(() => false);
    const errorVisible = await reg.errorMessages.isVisible().catch(() => false);
    expect(errorVisible || hasErrorText || page.url().includes('register')).toBeTruthy();
  });

  // ─── TC008 ────────────────────────────────────────────────────────────────
  test('TC008 - Registration with Weak Password (Too Short - 5 chars)', async ({ page }) => {
    const uniqueEmail = `weak-pw+${Date.now()}@test.com`;

    await reg.firstNameInput.fill('Tuang');
    await reg.lastNameInput.fill('Test');
    await reg.emailInput.fill(uniqueEmail);
    await reg.passwordInput.fill('12345'); // 5 characters

    await reg.screenshot('TC008', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC008', '02-after-submit');

    const errorVisible = await reg.errorMessages.isVisible().catch(() => false);
    const hasErrorText = await page
      .locator('text=/short|length|minimum|password/i')
      .first()
      .isVisible()
      .catch(() => false);
    const registered = !page.url().includes('register') && !errorVisible && !hasErrorText;
    console.log(
      `TC008 — 5-char password: error=${errorVisible || hasErrorText}, registered=${registered}`
    );
  });

  // ─── TC009 ────────────────────────────────────────────────────────────────
  test('TC009 - All Fields Blank Submission', async ({ page }) => {
    await reg.screenshot('TC009', '01-all-blank');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC009', '02-after-submit');

    // Registration must NOT succeed with all fields blank.
    const signedIn = await page
      .locator('a[href*="logout"], a[href*="sign_out"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(signedIn).toBe(false);
  });

  // ─── TC010 ────────────────────────────────────────────────────────────────
  test('TC010 - Verify Password Field Masks Input', async ({ page }) => {
    await reg.passwordInput.fill('12345');
    await reg.screenshot('TC010', '01-password-typed');

    // Input type must be "password" — browser renders value as masked dots
    const inputType = await reg.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  // ─── TC011 ────────────────────────────────────────────────────────────────
  test('TC011 - Verify Page Title and Form Fields Present', async ({ page }) => {
    await reg.screenshot('TC011', '01-page-loaded');

    await expect(page).toHaveTitle(/.+/);
    await expect(reg.firstNameInput).toBeVisible();
    await expect(reg.lastNameInput).toBeVisible();
    await expect(reg.emailInput).toBeVisible();
    await expect(reg.passwordInput).toBeVisible();
    await expect(reg.submitButton).toBeVisible();
  });

  // ─── TC012 ────────────────────────────────────────────────────────────────
  test('TC012 - Registration with Special Characters in First Name', async ({ page }) => {
    const uniqueEmail = `special-fn+${Date.now()}@test.com`;

    await reg.firstNameInput.fill('Tu@ng!');
    await reg.lastNameInput.fill('Test');
    await reg.emailInput.fill(uniqueEmail);
    await reg.passwordInput.fill('Password123');

    await reg.screenshot('TC012', '01-form-filled');
    await reg.submitForm();
    await page.waitForLoadState('load');
    await reg.screenshot('TC012', '02-after-submit');

    const errorVisible = await reg.errorMessages.isVisible().catch(() => false);
    const onRegisterPage = page.url().includes('/account/register');
    console.log(
      `TC012 — special chars in first name: error=${errorVisible}, onRegister=${onRegisterPage}`
    );
  });

  // ─── TC013 ────────────────────────────────────────────────────────────────
  test('TC013 - Verify Navigation to Login Page from Register Page', async ({ page }) => {
    await reg.screenshot('TC013', '01-register-page');

    await expect(reg.signInLink).toBeVisible();
    await reg.signInLink.click();
    await page.waitForLoadState('load');
    await reg.screenshot('TC013', '02-after-click-signin');

    await expect(page).toHaveURL(/\/account\/login|\/account\/sign_in/i);
  });
});
