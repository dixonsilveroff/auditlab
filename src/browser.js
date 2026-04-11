// src/browser.js — Playwright browser lifecycle management
import { chromium } from 'playwright';

/**
 * Launch a headless Chromium browser.
 * @returns {Promise<{ browser: import('playwright').Browser }>}
 */
export async function launchBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('[browser] Chromium launched');
  return { browser };
}

/**
 * Close the browser gracefully.
 * @param {import('playwright').Browser} browser
 */
export async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
    console.log('[browser] Chromium closed');
  }
}
