#!/usr/bin/env node
// audit.js — AuditLab CLI entry point
import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import fs from 'fs';

import { discoverPages, getPageName } from './src/crawler.js';
import { launchBrowser, closeBrowser } from './src/browser.js';
import { captureScreenshots } from './src/screenshot.js';
import { runLighthouse } from './src/lighthouse.js';
import { analyzeScreenshot } from './src/vision.js';
import { aggregateIssues } from './src/aggregator.js';
import { generateReport } from './src/report.js';
import { generatePdf } from './src/pdf.js';

// ── CLI Setup ────────────────────────────────────────────
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <url> [options]')
  .command('$0 <url>', 'Run a website audit', (yargs) => {
    yargs.positional('url', {
      describe: 'The website URL to audit',
      type: 'string',
    });
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory',
    default: './outputs',
    type: 'string',
  })
  .option('pages', {
    alias: 'p',
    describe: 'Maximum number of pages to audit',
    default: 3,
    type: 'number',
  })
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .parse();

// ── Main Pipeline ────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  let url = argv.url;

  // Ensure URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const domain = new URL(url).hostname;
  const outputDir = path.resolve(argv.output, domain);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              🔍 AuditLab v1.0.0                 ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Target:  ${url}`);
  console.log(`  Output:  ${outputDir}`);
  console.log(`  Pages:   up to ${argv.pages}`);
  console.log('');

  // ── Step 1: Discover pages ──
  console.log('━━━ Step 1/7: Discovering pages ━━━');
  const pageUrls = await discoverPages(url, argv.pages);
  const pages = pageUrls.map((u) => ({
    name: getPageName(u, url),
    url: u,
  }));
  console.log(`  Found ${pages.length} page(s):`);
  pages.forEach((p) => console.log(`    → ${p.name}: ${p.url}`));
  console.log('');

  // ── Step 2: Capture screenshots ──
  console.log('━━━ Step 2/7: Capturing screenshots ━━━');
  const { browser } = await launchBrowser();
  const screenshotPaths = {};

  for (const page of pages) {
    try {
      screenshotPaths[page.name] = await captureScreenshots(
        browser,
        page.url,
        page.name,
        outputDir
      );
    } catch (error) {
      console.error(`  ✗ Failed to screenshot ${page.name}: ${error.message}`);
      screenshotPaths[page.name] = { desktop: null, mobile: null };
    }
  }
  await closeBrowser(browser);
  console.log('');

  // ── Step 3: Run Lighthouse audits ──
  console.log('━━━ Step 3/7: Running Lighthouse audits ━━━');
  const lighthouseResults = {};

  for (const page of pages) {
    try {
      lighthouseResults[page.name] = await runLighthouse(
        page.url,
        page.name,
        outputDir
      );
    } catch (error) {
      console.error(`  ✗ Lighthouse failed for ${page.name}: ${error.message}`);
      lighthouseResults[page.name] = null;
    }
  }
  console.log('');

  // ── Step 4: Vision analysis ──
  console.log('━━━ Step 4/7: Running vision analysis ━━━');
  const visionResults = {};

  for (const page of pages) {
    const screenshots = screenshotPaths[page.name];
    const pageIssues = [];

    // Analyze desktop screenshot
    if (screenshots?.desktop) {
      const issues = await analyzeScreenshot(screenshots.desktop);
      pageIssues.push(...issues);
    }

    // Analyze mobile screenshot (limit API calls by only doing desktop for now)
    // Mobile analysis can be enabled by uncommenting below:
    // if (screenshots?.mobile) {
    //   const issues = await analyzeScreenshot(screenshots.mobile);
    //   pageIssues.push(...issues);
    // }

    visionResults[page.name] = pageIssues;
  }
  console.log('');

  // ── Step 5: Aggregate issues ──
  console.log('━━━ Step 5/7: Aggregating issues ━━━');
  const allIssues = aggregateIssues(lighthouseResults, visionResults);
  console.log(`  Total issues: ${allIssues.length}`);
  console.log('');

  // ── Step 6: Generate report ──
  console.log('━━━ Step 6/7: Generating markdown report ━━━');
  const reportPath = generateReport(
    domain,
    url,
    pages,
    lighthouseResults,
    screenshotPaths,
    allIssues,
    outputDir
  );

  // ── Step 7: Generate PDF ──
  console.log('━━━ Step 7/7: Generating PDF report ━━━');
  const pdfPath = await generatePdf(reportPath);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              ✅ Audit Complete!                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Report (MD):  ${reportPath}`);
  console.log(`  Report (PDF): ${pdfPath}`);
  console.log(`  Duration:     ${elapsed}s`);
  console.log(`  Issues:       ${allIssues.length} found`);
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error(`❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
