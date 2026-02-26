import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ApplyNowPage } from './pages/ApplyNowPage';

// ---------------------------------------------------------------------------
// Credentials — set in .env or pass via environment variables
// ---------------------------------------------------------------------------
const USERNAME = process.env.LOGIN_USERNAME ?? 'testuser';
const PASSWORD = process.env.LOGIN_PASSWORD ?? 'testpass';

// ---------------------------------------------------------------------------
// Reusable test data
// ---------------------------------------------------------------------------
const VALID_CONTACT = {
  mobile: '0821234567',
  email: 'test.applicant@example.com',
};

const VALID_EMPLOYMENT = {
  status: 'Permanent',
  employer: 'Acme Corp',
  grossIncome: '25000',
  netIncome: '18000',
  salaryDay: '25',
};

// ---------------------------------------------------------------------------
// Shared login helper used in beforeEach
// ---------------------------------------------------------------------------
async function loginAsTestUser(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(USERNAME, PASSWORD);
  // Wait for the dashboard / home page to be ready after login
  await loginPage.page.waitForURL(/(?!.*login).*/, { timeout: 15000 });
}

// ===========================================================================
// Test suite
// ===========================================================================

test.describe('Authentication', () => {
  test('should display the login page on first visit', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveURL(/staging\.finchoice\.mobi/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show an error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@user.com', 'wrongpassword');

    await loginPage.expectLoginError();
  });

  test('should log in successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsTestUser(loginPage);

    // After login the URL should no longer be the login page
    await expect(page).not.toHaveURL(/login/i);
  });
});

// ===========================================================================

test.describe('Apply Now — entry point', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsTestUser(loginPage);
  });

  test('should display the Apply Now button on the home page', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await expect(applyPage.applyNowButton).toBeVisible();
  });

  test('should navigate to the application form when Apply Now is clicked', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.clickApplyNow();

    // The URL or page content should change to reflect the application form
    await expect(page).toHaveURL(/apply|application|loan/i, { timeout: 10000 });
  });
});

// ===========================================================================

test.describe('Apply Now — Contact Details step', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsTestUser(loginPage);
    const applyPage = new ApplyNowPage(page);
    await applyPage.clickApplyNow();
  });

  test('should show the contact details form fields', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await expect(applyPage.mobileNumberInput).toBeVisible();
    await expect(applyPage.emailInput).toBeVisible();
  });

  test('should accept a valid SA mobile number and email', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillContactDetails(VALID_CONTACT);
    await applyPage.clickNext();

    // Should advance to the next step — no validation errors visible
    await expect(applyPage.validationErrors).toHaveCount(0);
  });

  test('should reject an invalid mobile number', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillContactDetails({ mobile: '123', email: VALID_CONTACT.email });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should reject an invalid email address', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillContactDetails({ mobile: VALID_CONTACT.mobile, email: 'not-an-email' });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should require both mobile and email fields', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    // Leave fields empty and try to proceed
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should reject a mobile number that does not start with 0 or +27', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillContactDetails({ mobile: '9999999999', email: VALID_CONTACT.email });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });
});

// ===========================================================================

test.describe('Apply Now — Employment & Income step', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsTestUser(loginPage);
    const applyPage = new ApplyNowPage(page);
    await applyPage.clickApplyNow();
    // Complete contact step to reach employment step
    await applyPage.fillContactDetails(VALID_CONTACT);
    await applyPage.clickNext();
    // Wait for employment section to load
    await applyPage.employmentStatusSelect.waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should display employment and income fields', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await expect(applyPage.employmentStatusSelect).toBeVisible();
    await expect(applyPage.grossIncomeInput).toBeVisible();
    await expect(applyPage.netIncomeInput).toBeVisible();
  });

  test('should accept valid permanent employment details', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillEmploymentDetails(VALID_EMPLOYMENT);
    await applyPage.clickNext();

    await expect(applyPage.validationErrors).toHaveCount(0);
  });

  test('should require employment status to be selected', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillEmploymentDetails({
      employer: VALID_EMPLOYMENT.employer,
      grossIncome: VALID_EMPLOYMENT.grossIncome,
      netIncome: VALID_EMPLOYMENT.netIncome,
    });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should require gross income to be greater than zero', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillEmploymentDetails({
      ...VALID_EMPLOYMENT,
      grossIncome: '0',
    });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should not accept net income greater than gross income', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.fillEmploymentDetails({
      ...VALID_EMPLOYMENT,
      grossIncome: '10000',
      netIncome: '15000', // net > gross — invalid
    });
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should reject non-numeric income values', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.grossIncomeInput.fill('abcde');
    await applyPage.clickNext();

    await applyPage.expectValidationErrors();
  });

  test('should allow navigating back to contact details step', async ({ page }) => {
    const applyPage = new ApplyNowPage(page);
    await applyPage.clickBack();

    await expect(applyPage.mobileNumberInput).toBeVisible({ timeout: 10000 });
  });
});

// ===========================================================================

test.describe('Apply Now — Full happy path submission', () => {
  test('should complete and submit a valid application end-to-end', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const applyPage = new ApplyNowPage(page);

    // Step 1: Login
    await loginAsTestUser(loginPage);

    // Step 2: Navigate to Apply Now
    await applyPage.clickApplyNow();

    // Step 3: Fill contact details
    await applyPage.fillContactDetails(VALID_CONTACT);
    await applyPage.clickNext();

    // Step 4: Fill employment & income
    await applyPage.employmentStatusSelect.waitFor({ state: 'visible', timeout: 10000 });
    await applyPage.fillEmploymentDetails(VALID_EMPLOYMENT);
    await applyPage.clickNext();

    // Step 5: Review / submit — click through any remaining steps
    // If there are more steps, add them here. Otherwise submit.
    await applyPage.submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await applyPage.clickSubmit();

    // Step 6: Assert success
    await applyPage.expectSuccess();
  });
});

// ===========================================================================

test.describe('Apply Now — Accessibility & UI checks', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsTestUser(loginPage);
    const applyPage = new ApplyNowPage(page);
    await applyPage.clickApplyNow();
  });

  test('all form inputs should have an associated label or aria-label', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]), select, textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      const isAccessible = hasLabel || !!ariaLabel || !!ariaLabelledBy;
      expect(isAccessible, `Input #${i} (id="${id}") has no accessible label`).toBe(true);
    }
  });

  test('page title should be set', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test('form should be visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const applyPage = new ApplyNowPage(page);
    await expect(applyPage.mobileNumberInput).toBeVisible();
    await expect(applyPage.emailInput).toBeVisible();
  });
});
