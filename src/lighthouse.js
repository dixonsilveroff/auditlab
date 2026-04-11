// src/lighthouse.js — Programmatic Lighthouse audit runner
import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

/**
 * Run a Lighthouse audit on a URL and extract key scores.
 *
 * @param {string} url - The URL to audit
 * @param {string} pageName - Slug name for the page
 * @param {string} outputDir - Base output directory
 * @returns {Promise<{ performance: number, accessibility: number, seo: number } | null>}
 */
export async function runLighthouse(url, pageName, outputDir) {
  const lighthouseDir = path.join(outputDir, 'lighthouse');
  fs.mkdirSync(lighthouseDir, { recursive: true });

  let chrome;
  try {
    // Launch Chrome via chrome-launcher (Lighthouse's expected interface)
    chrome = await launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });

    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'seo'],
    });

    const { lhr } = result;

    const scores = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
    };

    // Save the raw JSON report
    const jsonPath = path.join(lighthouseDir, `${pageName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2));

    console.log(
      `[lighthouse] ${pageName}: Performance=${scores.performance}, Accessibility=${scores.accessibility}, SEO=${scores.seo}`
    );

    try { await chrome.kill(); } catch { /* ignore cleanup errors on Windows */ }
    return scores;
  } catch (error) {
    console.error(`[lighthouse] Error auditing ${pageName}: ${error.message}`);
    try { if (chrome) await chrome.kill(); } catch { /* ignore */ }
    return null;
  }
}
