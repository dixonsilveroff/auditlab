// src/pdf.js — PDF report generator (Markdown → HTML → PDF via Playwright)
import fs from 'fs';
import MarkdownIt from 'markdown-it';
import { chromium } from 'playwright';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

/**
 * Build a fully styled HTML document from the markdown report content.
 */
function buildHtml(markdownContent) {
  const htmlBody = md.render(markdownContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuditLab Report</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a2e;
      --text-secondary: #555;
      --border: #e0e0e0;
      --accent: #4361ee;
      --high: #e74c3c;
      --medium: #f39c12;
      --low: #27ae60;
      --code-bg: #f5f5f5;
      --table-header: #f8f9fa;
      --table-stripe: #fafbfc;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.7;
      font-size: 13px;
      padding: 40px 50px;
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--accent);
      border-bottom: 3px solid var(--accent);
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 19px;
      font-weight: 600;
      color: var(--text);
      margin-top: 32px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      margin-top: 22px;
      margin-bottom: 8px;
    }

    h4 {
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 6px;
      color: var(--text-secondary);
    }

    p {
      margin-bottom: 10px;
    }

    strong {
      font-weight: 600;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 24px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px;
      font-size: 12.5px;
    }

    th {
      background: var(--table-header);
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid var(--border);
    }

    td {
      padding: 8px 14px;
      border: 1px solid var(--border);
    }

    tr:nth-child(even) td {
      background: var(--table-stripe);
    }

    ul {
      margin: 8px 0 16px 24px;
    }

    li {
      margin-bottom: 5px;
    }

    img {
      max-width: 100%;
      height: auto;
      border: 1px solid var(--border);
      border-radius: 6px;
      margin: 8px 0 16px;
    }

    em {
      color: var(--text-secondary);
      font-size: 12px;
    }

    /* Page break before each page breakdown section */
    h2 + h3 {
      break-before: avoid;
    }

    @media print {
      body { padding: 20px 30px; }
      h2 { break-after: avoid; }
      img { break-inside: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
}

/**
 * Generate a PDF from the markdown report file.
 *
 * @param {string} markdownPath - Path to the report.md file
 * @param {import('playwright').Browser} [browser] - Optional existing browser to reuse
 * @returns {Promise<string>} Path to the generated PDF
 */
export async function generatePdf(markdownPath, browser = null) {
  const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
  const html = buildHtml(markdownContent);

  const pdfPath = markdownPath.replace(/\.md$/, '.pdf');

  // Use Playwright to render to PDF
  const ownBrowser = !browser;
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: 'load' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm',
    },
  });

  await context.close();
  if (ownBrowser) await browser.close();

  console.log(`[report] PDF saved to ${pdfPath}`);
  return pdfPath;
}
