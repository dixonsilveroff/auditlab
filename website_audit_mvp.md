---
title: Automated Website Audit Tool (MVP) - Technical Documentation
---

# 1. Objective & Constraints

This system is designed to rapidly generate technical website audits for
client acquisition and conversion.\
The primary objective is to transform a URL into a structured audit
report within minutes.\
\
Definition of Done:\
- Screenshots (desktop + mobile) for 3 key pages\
- Lighthouse scores (Performance, Accessibility, SEO)\
- Vision-detected UI/UX issues\
- Structured Markdown report\
\
Non-Goals:\
- Full site crawling\
- Real-time monitoring\
- Complex dashboards\
\
Tradeoffs:\
- Favor speed over completeness\
- Accept minor inaccuracies in vision analysis

# 2. System Overview

Pipeline:\
1. Input URL\
2. Detect key pages\
3. Render pages via Playwright\
4. Capture screenshots\
5. Run Lighthouse audits\
6. Perform vision analysis\
7. Aggregate issues\
8. Generate Markdown report

# 3. Technology Stack

\- Node.js: Orchestration runtime\
- Playwright: Browser automation\
- Lighthouse: Performance and SEO audits\
- Vision API: Screenshot analysis\
- Markdown: Report output\
- Local filesystem: Storage

# 4. Project Structure

/audit-tool\
/src\
crawler.js\
browser.js\
screenshot.js\
lighthouse.js\
vision.js\
aggregator.js\
report.js\
/outputs\
audit.js

# 5. Page Selection Strategy

\- Homepage: root URL\
- Service page: detect links containing \'service\', \'product\'\
- Contact page: detect \'contact\'\
\
Fallback:\
- Use first 3 internal links if detection fails

# 6. Browser Automation

Use Playwright:\
- Launch Chromium in headless mode\
- Set viewport sizes:\
Desktop: 1280x800\
Mobile: 375x667\
- Wait for network idle before capture\
- Handle timeouts gracefully

# 7. Screenshot System

Capture:\
- Full-page screenshots\
- Desktop + mobile\
\
Naming:\
- homepage-desktop.png\
- homepage-mobile.png\
\
Store in /outputs/{domain}/screenshots

# 8. Lighthouse Integration

Run Lighthouse programmatically.\
\
Extract:\
- Performance score\
- Accessibility score\
- SEO score\
\
Store results as JSON.

# 9. Vision Analysis

Send screenshots to vision model.\
\
Prompt structure:\
- Identify layout issues\
- Identify readability problems\
- Identify CTA issues\
\
Return structured JSON:\
{\
issue: \"\",\
severity: \"\",\
recommendation: \"\"\
}

# 10. Issue Aggregation

Merge results from:\
- Lighthouse\
- Vision\
\
Remove duplicates.\
\
Assign severity:\
- High: blocks usability\
- Medium: degrades UX\
- Low: cosmetic

# 11. Report Generation

Generate Markdown report.\
\
Sections:\
- Overview\
- Key issues\
- Page breakdown\
\
Embed screenshots using relative paths.

# 12. CLI Interface

Command:\
node audit.js https://example.com\
\
Optional flags:\
\--output\
\--pages

# 13. Error Handling

\- Retry page loads\
- Skip failed pages\
- Continue report generation even if partial failure occurs

# 14. Performance

\- Sequential execution\
- Target runtime: 2--5 minutes per audit

# 15. Cost Control

\- Limit vision API calls\
- Avoid duplicate analysis

# 16. Testing

Test on:\
- Static sites\
- CMS sites\
- JS-heavy sites

# 17. Limitations

\- Limited page coverage\
- Vision inaccuracies

# 18. Future Improvements

\- Full crawl\
- Dashboard UI\
- Batch processing
