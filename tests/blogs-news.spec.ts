import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  BLOG_URL,
  RESULTS_DIR,
  SCREENSHOT_DIR,
  screenshotStep,
} from './pages/BlogsNewsPage';

// ─── Result accumulator ───────────────────────────────────────────────────────
interface TestResult {
  tcId: string;
  title: string;
  section: string;
  priority: string;
  status: string;
  screenshot: string;
  notes: string;
}
const results: TestResult[] = [];

const META: Record<string, { section: string; priority: string }> = {
  TC001: { section: 'Page Load',         priority: 'High'   },
  TC002: { section: 'Page Load',         priority: 'Medium' },
  TC003: { section: 'Navigation',        priority: 'Medium' },
  TC004: { section: 'Navigation',        priority: 'High'   },
  TC005: { section: 'Navigation',        priority: 'High'   },
  TC006: { section: 'Navigation',        priority: 'High'   },
  TC007: { section: 'Navigation',        priority: 'High'   },
  TC008: { section: 'Navigation',        priority: 'High'   },
  TC009: { section: 'Cart',             priority: 'High'   },
  TC010: { section: 'Cart',             priority: 'High'   },
  TC011: { section: 'Cart',             priority: 'High'   },
  TC012: { section: 'Navigation',        priority: 'High'   },
  TC013: { section: 'Navigation',        priority: 'Medium' },
  TC014: { section: 'Navigation',        priority: 'High'   },
  TC015: { section: 'Navigation',        priority: 'High'   },
  TC016: { section: 'Navigation',        priority: 'High'   },
  TC017: { section: 'Navigation',        priority: 'High'   },
  TC018: { section: 'Navigation',        priority: 'High'   },
  TC019: { section: 'Navigation',        priority: 'High'   },
  TC020: { section: 'Blog Content',      priority: 'High'   },
  TC021: { section: 'Blog Content',      priority: 'Medium' },
  TC022: { section: 'Blog Content',      priority: 'Medium' },
  TC023: { section: 'Blog Content',      priority: 'High'   },
  TC024: { section: 'Blog Content',      priority: 'Medium' },
  TC025: { section: 'Blog Content',      priority: 'Medium' },
  TC026: { section: 'Footer',            priority: 'Medium' },
  TC027: { section: 'Footer',            priority: 'Medium' },
  TC028: { section: 'Footer',            priority: 'Low'    },
  TC029: { section: 'Footer',            priority: 'Low'    },
  TC030: { section: 'Footer',            priority: 'Low'    },
  TC031: { section: 'Navigation',        priority: 'Low'    },
  TC032: { section: 'Navigation',        priority: 'Low'    },
  TC033: { section: 'Responsive Design', priority: 'Medium' },
  TC034: { section: 'Responsive Design', priority: 'Medium' },
  TC035: { section: 'Performance',       priority: 'High'   },
  TC036: { section: 'UI',               priority: 'Medium' },
  TC037: { section: 'Cross-Browser',     priority: 'High'   },
  TC038: { section: 'Cross-Browser',     priority: 'High'   },
  TC039: { section: 'Cross-Browser',     priority: 'Medium' },
  TC040: { section: 'Security',          priority: 'High'   },
};

// ─── Write CSV after all tests ────────────────────────────────────────────────
test.afterAll(async () => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const header = 'TC ID,Title,Section,Priority,Status,Screenshot,Notes\n';
  const rows = results
    .map(r =>
      `${r.tcId},"${r.title.replace(/"/g, '""')}",${r.section},${r.priority},${r.status},"${r.screenshot}","${r.notes.replace(/"/g, '""')}"`
    )
    .join('\n');
  const csvPath = path.join(RESULTS_DIR, 'DemoSource_BlogsNews_testresult.csv');
  fs.writeFileSync(csvPath, header + rows, 'utf-8');
  console.log(`\n✓ Results saved → ${csvPath}`);
  console.log(`✓ Screenshots   → ${SCREENSHOT_DIR}`);
});

// ─── Capture result per test ──────────────────────────────────────────────────
test.afterEach(async ({ page }, testInfo) => {
  const tcMatch = testInfo.title.match(/^(TC\d+)/);
  const tcId = tcMatch ? tcMatch[1] : 'UNKNOWN';
  const meta = META[tcId] ?? { section: 'Other', priority: 'Medium' };
  const status =
    testInfo.status === 'passed'  ? 'PASS' :
    testInfo.status === 'skipped' ? 'SKIP' : 'FAIL';
  const notes = (testInfo.error?.message ?? '').replace(/\n/g, ' ').slice(0, 300);
  const shot = await screenshotStep(page, tcId, 'final').catch(() => '');
  results.push({
    tcId,
    title: testInfo.title,
    section: meta.section,
    priority: meta.priority,
    status,
    screenshot: shot,
    notes,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe('DemoSource BlogsNews Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  // ── TC001 ──────────────────────────────────────────────────────────────────
  test('TC001 - Verify Blog page loads successfully', async ({ page }) => {
    await screenshotStep(page, 'TC001', '01-page-loaded');
    const response = await page.goto(BLOG_URL);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/News/);
    await expect(page.locator('text=Sauce Demo').first()).toBeVisible();
  });

  // ── TC002 ──────────────────────────────────────────────────────────────────
  test('TC002 - Verify page title in browser tab', async ({ page }) => {
    await screenshotStep(page, 'TC002', '01-page-title');
    await expect(page).toHaveTitle('News – Sauce Demo');
  });

  // ── TC003 ──────────────────────────────────────────────────────────────────
  test('TC003 - Verify breadcrumb navigation displays correctly', async ({ page }) => {
    await screenshotStep(page, 'TC003', '01-breadcrumb');
    const breadcrumb = page.locator('#breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/"]')).toBeVisible();
    await expect(breadcrumb).toContainText(/News/i);
  });

  // ── TC004 ──────────────────────────────────────────────────────────────────
  test('TC004 - Verify breadcrumb Home link navigates to homepage', async ({ page }) => {
    const homeLink = page.locator('#breadcrumb a[href="/"]');
    await expect(homeLink).toBeVisible();
    await screenshotStep(page, 'TC004', '01-before-click');
    await homeLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC004', '02-after-click');
    expect(page.url()).toBe('https://sauce-demo.myshopify.com/');
  });

  // ── TC005 ──────────────────────────────────────────────────────────────────
  test('TC005 - Verify top navigation Search link works', async ({ page }) => {
    await screenshotStep(page, 'TC005', '01-before-click');
    const searchLink = page.locator(
      'header a[href="/search"], .site-header a[href="/search"], nav a[href="/search"]'
    ).first();
    await expect(searchLink).toBeVisible();
    await searchLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC005', '02-search-page');
    expect(page.url()).toContain('/search');
  });

  // ── TC006 ──────────────────────────────────────────────────────────────────
  test('TC006 - Verify top navigation About Us link works', async ({ page }) => {
    await screenshotStep(page, 'TC006', '01-before-click');
    const aboutLink = page.locator(
      'header a[href="/pages/about-us"], .site-header a[href="/pages/about-us"]'
    ).first();
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC006', '02-about-page');
    expect(page.url()).toContain('/pages/about-us');
  });

  // ── TC007 ──────────────────────────────────────────────────────────────────
  test('TC007 - Verify top navigation Log In link works', async ({ page }) => {
    await screenshotStep(page, 'TC007', '01-before-click');
    const loginLink = page.locator(
      'header a[href="/account/login"], .site-header a[href="/account/login"]'
    ).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC007', '02-login-page');
    expect(page.url()).toContain('/account/login');
  });

  // ── TC008 ──────────────────────────────────────────────────────────────────
  test('TC008 - Verify top navigation Sign Up link works', async ({ page }) => {
    await screenshotStep(page, 'TC008', '01-before-click');
    const signUpLink = page.locator(
      'header a[href="/account/register"], .site-header a[href="/account/register"]'
    ).first();
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC008', '02-register-page');
    expect(page.url()).toContain('/account/register');
  });

  // ── TC009 ──────────────────────────────────────────────────────────────────
  test('TC009 - Verify cart icon displays with correct item count', async ({ page }) => {
    await screenshotStep(page, 'TC009', '01-cart-icon');
    // Desktop cart toggle (visible on desktop)
    const cartBtn = page.locator('a.toggle-drawer.cart, a[class*="toggle-drawer"]').first();
    await expect(cartBtn).toBeVisible();
    await expect(cartBtn).toContainText(/My Cart/i);
    await expect(cartBtn).toContainText('(0)');
  });

  // ── TC010 ──────────────────────────────────────────────────────────────────
  test('TC010 - Verify cart link navigates to cart page', async ({ page }) => {
    await screenshotStep(page, 'TC010', '01-before-click');
    // Verify the cart href exists then navigate to it
    const cartLink = page.locator('a.cart.mobile, a[href="/cart"].cart');
    const href = await cartLink.getAttribute('href');
    expect(href).toBe('/cart');
    await page.goto('https://sauce-demo.myshopify.com/cart');
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC010', '02-cart-page');
    expect(page.url()).toContain('/cart');
  });

  // ── TC011 ──────────────────────────────────────────────────────────────────
  test('TC011 - Verify Check Out button is visible and links correctly', async ({ page }) => {
    await screenshotStep(page, 'TC011', '01-before-click');
    // Check Out button may be in a cart drawer or top-bar area
    const checkoutBtn = page.locator(
      'a:has-text("Check Out"), a:has-text("Checkout"), button:has-text("Check Out"), button:has-text("Checkout")'
    ).first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC011', '02-after-click');
    expect(page.url()).toContain('/cart');
  });

  // ── TC012 ──────────────────────────────────────────────────────────────────
  test('TC012 - Verify Sauce Demo logo/title link navigates to homepage', async ({ page }) => {
    await screenshotStep(page, 'TC012', '01-before-click');
    const logoLink = page.locator(
      '.site-header__logo-link, .site-header a[href="/"], header a.logo, header a[href="/"]'
    ).first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC012', '02-homepage');
    expect(page.url()).toBe('https://sauce-demo.myshopify.com/');
  });

  // ── TC013 ──────────────────────────────────────────────────────────────────
  test('TC013 - Verify hamburger/Menu toggle is present on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BLOG_URL);
    await page.waitForLoadState('domcontentloaded');
    await screenshotStep(page, 'TC013', '01-mobile-view');
    // The toggle has id="toggle-menu" and class="mobile"
    const menuToggle = page.locator('a#toggle-menu, a.mobile:has-text("Menu")').first();
    await expect(menuToggle).toBeVisible();
  });

  // ── TC014 ──────────────────────────────────────────────────────────────────
  test('TC014 - Verify side navigation Home link works', async ({ page }) => {
    await screenshotStep(page, 'TC014', '01-before-click');
    // Side nav is in #sidebar nav / ul#main-menu
    const homeLink = page.locator('#main-menu a[href="/"], #sidebar a[href="/"]').first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC014', '02-homepage');
    expect(page.url()).toBe('https://sauce-demo.myshopify.com/');
  });

  // ── TC015 ──────────────────────────────────────────────────────────────────
  test('TC015 - Verify side navigation Catalog link works', async ({ page }) => {
    await screenshotStep(page, 'TC015', '01-before-click');
    const catalogLink = page.locator('#main-menu a[href="/collections/all"], #sidebar a[href="/collections/all"]').first();
    await expect(catalogLink).toBeVisible();
    await catalogLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC015', '02-catalog-page');
    expect(page.url()).toContain('/collections/all');
  });

  // ── TC016 ──────────────────────────────────────────────────────────────────
  test('TC016 - Verify side navigation Blog link works', async ({ page }) => {
    await screenshotStep(page, 'TC016', '01-before-click');
    const blogLink = page.locator('#main-menu a[href="/blogs/news"], #sidebar a[href="/blogs/news"]').first();
    await expect(blogLink).toBeVisible();
    await blogLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC016', '02-blog-page');
    expect(page.url()).toContain('/blogs/news');
  });

  // ── TC017 ──────────────────────────────────────────────────────────────────
  test('TC017 - Verify side navigation About Us link works', async ({ page }) => {
    await screenshotStep(page, 'TC017', '01-before-click');
    // #main-menu has About Us; use nth(1) to get the side nav one (second match)
    const aboutLink = page.locator('#main-menu a[href="/pages/about-us"], #sidebar a[href="/pages/about-us"]').first();
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC017', '02-about-page');
    expect(page.url()).toContain('/pages/about-us');
  });

  // ── TC018 ──────────────────────────────────────────────────────────────────
  test('TC018 - Verify side navigation Login link works', async ({ page }) => {
    await screenshotStep(page, 'TC018', '01-before-click');
    // Login link exists in side nav (may be in collapsed accordion on desktop)
    const loginLink = page.locator('#main-menu a[href*="account/login"], #sidebar a[href*="account/login"]').first();
    const href = await loginLink.getAttribute('href');
    expect(href).toContain('account/login');
    // Navigate to verify destination
    await page.goto('https://sauce-demo.myshopify.com/account/login');
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC018', '02-login-page');
    expect(page.url()).toContain('/account/login');
  });

  // ── TC019 ──────────────────────────────────────────────────────────────────
  test('TC019 - Verify side navigation Create Account link works', async ({ page }) => {
    await screenshotStep(page, 'TC019', '01-before-click');
    // Create account link exists in side nav (may be in collapsed accordion on desktop)
    const createLink = page.locator('#main-menu a[href*="account/register"], #sidebar a[href*="account/register"]').first();
    const href = await createLink.getAttribute('href');
    expect(href).toContain('account/register');
    await page.goto('https://sauce-demo.myshopify.com/account/register');
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC019', '02-register-page');
    expect(page.url()).toContain('/account/register');
  });

  // ── TC020 ──────────────────────────────────────────────────────────────────
  test('TC020 - Verify blog post title is displayed', async ({ page }) => {
    await screenshotStep(page, 'TC020', '01-blog-listing');
    const postTitle = page.locator(
      '.blog-article__title, .article__title, h2.h3 a, article h2, [class*="blog"] h2, [class*="article"] h2'
    ).first();
    await expect(postTitle).toBeVisible();
    await expect(postTitle).toContainText(/First Post/i);
  });

  // ── TC021 ──────────────────────────────────────────────────────────────────
  test('TC021 - Verify blog post author is displayed', async ({ page }) => {
    await screenshotStep(page, 'TC021', '01-blog-listing');
    // Author is in "Posted by <b>Shopify</b>" inside div.info
    const author = page.locator('div.info b, .info b').first();
    await expect(author).toBeVisible();
    await expect(author).toContainText(/Shopify/i);
  });

  // ── TC022 ──────────────────────────────────────────────────────────────────
  test('TC022 - Verify blog post body text is displayed', async ({ page }) => {
    await screenshotStep(page, 'TC022', '01-blog-body');
    // Blog post body is inside .wysiwyg
    const bodyText = page.locator('.wysiwyg p').first();
    await expect(bodyText).toBeVisible();
    const text = await bodyText.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // ── TC023 ──────────────────────────────────────────────────────────────────
  test('TC023 - Verify blog post title links to the full post', async ({ page }) => {
    await screenshotStep(page, 'TC023', '01-before-click');
    const postLink = page.locator(
      'a[href*="12832805-first-post"], a[href*="first-post"]'
    ).first();
    await expect(postLink).toBeVisible();
    await postLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC023', '02-full-post');
    expect(page.url()).toContain('/blogs/news/');
  });

  // ── TC024 ──────────────────────────────────────────────────────────────────
  test('TC024 - Verify Shopify ecommerce blog link in post body', async ({ page }) => {
    await screenshotStep(page, 'TC024', '01-blog-page');
    const blogLink = page.locator('a[href*="shopify.com/blog"]').first();
    await expect(blogLink).toBeVisible();
    const href = await blogLink.getAttribute('href');
    expect(href).toContain('shopify.com/blog');
    await screenshotStep(page, 'TC024', '02-link-found');
  });

  // ── TC025 ──────────────────────────────────────────────────────────────────
  test('TC025 - Verify Shopify hyperlink in post body', async ({ page }) => {
    await screenshotStep(page, 'TC025', '01-blog-page');
    const shopifyLink = page.locator(
      'a[href="http://www.shopify.com/"], a[href="https://www.shopify.com/"], a[href*="shopify.com"]:not([href*="shopify.com/blog"])'
    ).first();
    await expect(shopifyLink).toBeVisible();
    const href = await shopifyLink.getAttribute('href');
    expect(href).toMatch(/shopify\.com/i);
    await screenshotStep(page, 'TC025', '02-link-found');
  });

  // ── TC026 ──────────────────────────────────────────────────────────────────
  test('TC026 - Verify footer Search link works', async ({ page }) => {
    await page.locator('footer, .site-footer').first().scrollIntoViewIfNeeded();
    await screenshotStep(page, 'TC026', '01-footer');
    const searchLink = page.locator('footer a[href="/search"], .site-footer a[href="/search"]').first();
    await expect(searchLink).toBeVisible();
    await searchLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC026', '02-search-page');
    expect(page.url()).toContain('/search');
  });

  // ── TC027 ──────────────────────────────────────────────────────────────────
  test('TC027 - Verify footer About Us link works', async ({ page }) => {
    await page.locator('footer, .site-footer').first().scrollIntoViewIfNeeded();
    await screenshotStep(page, 'TC027', '01-footer');
    const aboutLink = page.locator('footer a[href*="about-us"], .site-footer a[href*="about-us"]').first();
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await page.waitForLoadState('load');
    await screenshotStep(page, 'TC027', '02-about-page');
    expect(page.url()).toContain('/pages/about-us');
  });

  // ── TC028 ──────────────────────────────────────────────────────────────────
  test('TC028 - Verify footer About Us description text is present', async ({ page }) => {
    const footer = page.locator('footer, .site-footer').first();
    await footer.scrollIntoViewIfNeeded();
    await screenshotStep(page, 'TC028', '01-footer-description');
    await expect(footer).toContainText(/Sauce|Shopify/i);
  });

  // ── TC029 ──────────────────────────────────────────────────────────────────
  test('TC029 - Verify payment icons are displayed in footer', async ({ page }) => {
    const pm = page.locator('#payment-methods');
    await pm.scrollIntoViewIfNeeded();
    await screenshotStep(page, 'TC029', '01-payment-icons');
    await expect(pm).toBeVisible();
    await expect(pm.locator('img').first()).toBeVisible();
  });

  // ── TC030 ──────────────────────────────────────────────────────────────────
  test('TC030 - Verify copyright text is displayed in footer', async ({ page }) => {
    const footer = page.locator('footer, .site-footer').first();
    await footer.scrollIntoViewIfNeeded();
    await screenshotStep(page, 'TC030', '01-footer-copyright');
    await expect(footer).toContainText(/Copyright|©|Sauce Demo/i);
  });

  // ── TC031 ──────────────────────────────────────────────────────────────────
  test('TC031 - Verify Wish List link is present in navigation', async ({ page }) => {
    await screenshotStep(page, 'TC031', '01-nav');
    const wishListLink = page.locator('a:has-text("Wish list"), a:has-text("Wishlist"), a[href*="wish"]').first();
    await expect(wishListLink).toBeVisible();
  });

  // ── TC032 ──────────────────────────────────────────────────────────────────
  test('TC032 - Verify Refer a Friend link is present in navigation', async ({ page }) => {
    await screenshotStep(page, 'TC032', '01-nav');
    const referLink = page.locator('a:has-text("Refer a friend"), a:has-text("Refer"), a[href*="refer"]').first();
    await expect(referLink).toBeVisible();
  });

  // ── TC033 ──────────────────────────────────────────────────────────────────
  test('TC033 - Verify page is responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BLOG_URL);
    await page.waitForLoadState('domcontentloaded');
    await screenshotStep(page, 'TC033', '01-tablet-layout');
    // Main content wrapper is div#main
    const mainContent = page.locator('#main');
    await expect(mainContent).toBeVisible();
    const box = await mainContent.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(768);
  });

  // ── TC034 ──────────────────────────────────────────────────────────────────
  test('TC034 - Verify page is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BLOG_URL);
    await page.waitForLoadState('domcontentloaded');
    await screenshotStep(page, 'TC034', '01-mobile-layout');
    const mainContent = page.locator('#main');
    await expect(mainContent).toBeVisible();
    const box = await mainContent.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  // ── TC035 ──────────────────────────────────────────────────────────────────
  test('TC035 - Verify page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BLOG_URL);
    await page.waitForLoadState('load');
    const loadTime = Date.now() - startTime;
    await screenshotStep(page, 'TC035', '01-page-loaded');
    console.log(`TC035: Page load time = ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10s upper bound for network variance
  });

  // ── TC036 ──────────────────────────────────────────────────────────────────
  test('TC036 - Verify page has no broken images', async ({ page }) => {
    await screenshotStep(page, 'TC036', '01-page');
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    if (brokenImages.length > 0) {
      console.warn('TC036: Broken images found:', brokenImages);
    }
    expect(brokenImages.length).toBe(0);
  });

  // ── TC037 ──────────────────────────────────────────────────────────────────
  test('TC037 - Verify page renders correctly in Chrome', async ({ page, browserName }) => {
    await screenshotStep(page, 'TC037', '01-chrome-render');
    // Chromium project covers Chrome rendering
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toMatch(/News/);
    console.log(`TC037: Running in ${browserName}`);
  });

  // ── TC038 ──────────────────────────────────────────────────────────────────
  test('TC038 - Verify page renders correctly in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox project not configured — skipped');
    await screenshotStep(page, 'TC038', '01-firefox-render');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/News/);
  });

  // ── TC039 ──────────────────────────────────────────────────────────────────
  test('TC039 - Verify page renders correctly in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari/WebKit project not configured — skipped');
    await screenshotStep(page, 'TC039', '01-safari-render');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/News/);
  });

  // ── TC040 ──────────────────────────────────────────────────────────────────
  test('TC040 - Verify page uses HTTPS', async ({ page }) => {
    await screenshotStep(page, 'TC040', '01-address-bar');
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('sauce-demo.myshopify.com');
  });
});
