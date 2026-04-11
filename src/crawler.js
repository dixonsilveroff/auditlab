// src/crawler.js — Page detection: homepage, service, contact
import { chromium } from 'playwright';

/**
 * Discover key pages from a root URL.
 * Looks for service/product pages and contact pages.
 * Falls back to the first N internal links if detection fails.
 *
 * @param {string} rootUrl - The website root URL
 * @param {number} maxPages - Maximum number of pages to return (default: 3)
 * @returns {Promise<string[]>} Array of discovered page URLs
 */
export async function discoverPages(rootUrl, maxPages = 3) {
  const base = new URL(rootUrl);
  const origin = base.origin;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(rootUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Extract all internal links
    const links = await page.evaluate((origin) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs = anchors
        .map((a) => {
          try {
            return new URL(a.href, origin).href;
          } catch {
            return null;
          }
        })
        .filter(
          (href) =>
            href &&
            href.startsWith(origin) &&
            !href.includes('#') &&
            !href.match(/\.(jpg|png|gif|svg|pdf|zip|css|js)$/i)
        );
      return [...new Set(hrefs)];
    }, origin);

    await browser.close();
    browser = null;

    // Always include the homepage
    const pages = [rootUrl];

    // Keyword-based detection
    const serviceKeywords = ['service', 'product', 'solution', 'offering'];
    const contactKeywords = ['contact', 'get-in-touch', 'reach-us'];

    const servicePage = links.find((link) =>
      serviceKeywords.some((kw) => link.toLowerCase().includes(kw))
    );
    const contactPage = links.find((link) =>
      contactKeywords.some((kw) => link.toLowerCase().includes(kw))
    );

    if (servicePage && !pages.includes(servicePage)) pages.push(servicePage);
    if (contactPage && !pages.includes(contactPage)) pages.push(contactPage);

    // Fallback: fill remaining slots with internal links
    if (pages.length < maxPages) {
      for (const link of links) {
        if (pages.length >= maxPages) break;
        if (!pages.includes(link) && link !== rootUrl) {
          pages.push(link);
        }
      }
    }

    return pages.slice(0, maxPages);
  } catch (error) {
    console.error(`[crawler] Error discovering pages: ${error.message}`);
    if (browser) await browser.close();
    return [rootUrl]; // Fallback to just the homepage
  }
}

/**
 * Generate a slug-friendly page name from a URL.
 * @param {string} url
 * @param {string} rootUrl
 * @returns {string}
 */
export function getPageName(url, rootUrl) {
  const base = new URL(rootUrl);
  const target = new URL(url);

  if (target.pathname === '/' || target.href === base.href) return 'homepage';

  return target.pathname
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase() || 'page';
}
