import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const BLOG_URL = 'https://sauce-demo.myshopify.com/blogs/news';
export const RESULTS_DIR = 'DemoSource_BlogsNews_testresult';
export const SCREENSHOT_DIR = path.join(RESULTS_DIR, 'screenshots');

export async function screenshotStep(page: Page, tcId: string, step: string): Promise<string> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filename = `${tcId}-${step}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
  return filename;
}
