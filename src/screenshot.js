// src/screenshot.js — Full-page screenshot capture (desktop + mobile)
import fs from 'fs';
import path from 'path';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },
};

const TIMEOUT = 30000;
const MAX_RETRIES = 1;

/**
 * Scroll from top to bottom of the page incrementally.
 * Triggers lazy-loaded content (IntersectionObserver, scroll-event listeners, etc.)
 *
 * @param {import('playwright').Page} page
 */
async function autoScrollPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const scrollStep = Math.max(window.innerHeight * 0.8, 400);
      const scrollDelay = 300;
      let currentPosition = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        if (currentPosition >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // scroll back to top
          resolve();
          return;
        }
        currentPosition += scrollStep;
        window.scrollTo(0, currentPosition);
      }, scrollDelay);
    });
  });
}

/**
 * Capture full-page screenshots of a URL at desktop and mobile viewports.
 *
 * @param {import('playwright').Browser} browser - The Playwright browser instance
 * @param {string} url - Page URL to capture
 * @param {string} pageName - Slug name for the page
 * @param {string} outputDir - Base output directory for this audit
 * @returns {Promise<{ desktop: string, mobile: string }>} Paths to saved screenshots
 */
export async function captureScreenshots(browser, url, pageName, outputDir) {
  const screenshotDir = path.join(outputDir, 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const results = {};

  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    const filename = `${pageName}-${viewport}.png`;
    const filepath = path.join(screenshotDir, filename);

    let success = false;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const context = await browser.newContext({
          viewport: size,
          userAgent:
            viewport === 'mobile'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        // Scroll through the page to trigger lazy-loaded content
        await autoScrollPage(page);
        // Allow extra time for final images and layout shifts to settle
        await page.waitForTimeout(2000);
        await page.screenshot({ path: filepath, fullPage: true });
        await context.close();

        console.log(`[screenshot] Captured ${viewport}: ${filename}`);
        results[viewport] = filepath;
        success = true;
        break;
      } catch (error) {
        console.warn(
          `[screenshot] Attempt ${attempt + 1} failed for ${viewport} (${pageName}): ${error.message}`
        );
      }
    }

    if (!success) {
      console.error(`[screenshot] Failed to capture ${viewport} for ${pageName}`);
      results[viewport] = null;
    }
  }

  return results;
}
