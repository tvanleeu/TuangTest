import { Page, Locator, expect } from '@playwright/test';

export class ApplyNowPage {
  readonly page: Page;

  // Navigation / entry point
  readonly applyNowButton: Locator;

  // Contact details
  readonly mobileNumberInput: Locator;
  readonly emailInput: Locator;

  // Employment & income
  readonly employmentStatusSelect: Locator;
  readonly employerNameInput: Locator;
  readonly grossIncomeInput: Locator;
  readonly netIncomeInput: Locator;
  readonly employmentStartDateInput: Locator;
  readonly salaryDayInput: Locator;

  // Form navigation buttons
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly submitButton: Locator;

  // Feedback elements
  readonly successMessage: Locator;
  readonly errorMessages: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Apply Now entry — update selector to match the actual button/link text
    this.applyNowButton = page.locator(
      'a:has-text("Apply Now"), button:has-text("Apply Now"), a:has-text("Apply"), button:has-text("Apply")'
    ).first();

    // --- Contact details (update selectors after inspecting the live site) ---
    this.mobileNumberInput = page.locator(
      'input[name*="mobile" i], input[name*="phone" i], input[name*="cell" i], input[id*="mobile" i], input[placeholder*="mobile" i], input[placeholder*="cell" i]'
    ).first();
    this.emailInput = page.locator(
      'input[type="email"], input[name*="email" i], input[id*="email" i]'
    ).first();

    // --- Employment & income ---
    this.employmentStatusSelect = page.locator(
      'select[name*="employment" i], select[id*="employment" i], [role="combobox"][aria-label*="employment" i]'
    ).first();
    this.employerNameInput = page.locator(
      'input[name*="employer" i], input[id*="employer" i], input[placeholder*="employer" i]'
    ).first();
    this.grossIncomeInput = page.locator(
      'input[name*="gross" i], input[id*="gross" i], input[placeholder*="gross" i]'
    ).first();
    this.netIncomeInput = page.locator(
      'input[name*="net" i], input[name*="nett" i], input[id*="net" i], input[placeholder*="net" i]'
    ).first();
    this.employmentStartDateInput = page.locator(
      'input[name*="start" i][type="date"], input[id*="start" i], input[placeholder*="start date" i]'
    ).first();
    this.salaryDayInput = page.locator(
      'input[name*="salary" i], select[name*="salary" i], input[id*="salaryDay" i]'
    ).first();

    // Navigation buttons
    this.nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue"), input[value="Next"]'
    ).first();
    this.backButton = page.locator(
      'button:has-text("Back"), button:has-text("Previous")'
    ).first();
    this.submitButton = page.locator(
      'button[type="submit"]:has-text("Submit"), button:has-text("Submit Application"), button:has-text("Apply")'
    ).first();

    // Feedback
    this.successMessage = page.locator(
      '[class*="success"], [role="alert"]:has-text("success"), h1:has-text("Thank"), h2:has-text("Thank")'
    ).first();
    this.errorMessages = page.locator('[class*="error"], [class*="alert-danger"], [role="alert"]');
    this.validationErrors = page.locator('[class*="invalid"], [class*="field-error"], .error-message, span[class*="error"]');
  }

  async clickApplyNow() {
    await this.applyNowButton.waitFor({ state: 'visible' });
    await this.applyNowButton.click();
  }

  async fillContactDetails(data: { mobile: string; email: string }) {
    await this.mobileNumberInput.waitFor({ state: 'visible' });
    await this.mobileNumberInput.fill(data.mobile);
    await this.emailInput.fill(data.email);
  }

  async fillEmploymentDetails(data: {
    status?: string;
    employer?: string;
    grossIncome?: string;
    netIncome?: string;
    salaryDay?: string;
  }) {
    if (data.status) {
      await this.employmentStatusSelect.selectOption({ label: data.status }).catch(async () => {
        // Fallback for custom dropdowns
        await this.employmentStatusSelect.click();
        await this.page.locator(`[role="option"]:has-text("${data.status}")`).click();
      });
    }
    if (data.employer) {
      await this.employerNameInput.fill(data.employer);
    }
    if (data.grossIncome) {
      await this.grossIncomeInput.fill(data.grossIncome);
    }
    if (data.netIncome) {
      await this.netIncomeInput.fill(data.netIncome);
    }
    if (data.salaryDay) {
      await this.salaryDayInput.fill(data.salaryDay);
    }
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async expectSuccess() {
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
  }

  async expectValidationErrors() {
    await expect(this.validationErrors.first()).toBeVisible();
  }
}
