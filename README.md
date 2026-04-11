# 🔍 AuditLab

**Automated website audit tool** — transform any URL into a structured technical audit report in minutes.

AuditLab crawls your target website, captures screenshots, runs Lighthouse performance audits, and uses AI vision analysis to detect UI/UX issues — all from a single CLI command.

---

## ✨ Features

- **Smart Page Discovery** — automatically detects homepage, service, and contact pages
- **Dual Viewport Screenshots** — full-page captures at desktop (1280×800) and mobile (375×667)
- **Lighthouse Audits** — Performance, Accessibility, and SEO scoring
- **AI Vision Analysis** — Google Gemini detects layout, readability, CTA, and accessibility issues
- **Structured Reports** — generates Markdown reports with embedded screenshots and issue breakdowns
- **Graceful Error Handling** — retries failed pages, skips errors, and continues the pipeline

---

## 📦 Installation

### Prerequisites

- **Node.js** v18 or higher
- **Google Chrome** installed (for Lighthouse)
- **Gemini API key** (optional, for AI vision analysis)

### Setup

```bash
# Clone the repository
git clone https://github.com/dixonsilveroff/auditlab.git
cd auditlab

# Install dependencies
npm install

# Install Playwright's Chromium browser (~150MB download)
npx playwright install chromium
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required for AI vision analysis (optional — audits work without it)
GEMINI_API_KEY=your-gemini-api-key-here

# Vision model (optional — defaults to gemini-2.5-pro)
GEMINI_MODEL=gemini-2.5-pro
```

Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

> **Note:** If no API key is set, AuditLab will skip vision analysis and still produce a report with Lighthouse scores and screenshots.

---

## 🚀 Usage

### Basic Audit

```bash
node audit.js https://example.com
```

This will:
1. Discover up to 3 key pages (homepage, service page, contact page)
2. Capture desktop + mobile screenshots for each page
3. Run Lighthouse audits on each page
4. Perform AI vision analysis on each screenshot (if API key is set)
5. Generate a Markdown report at `./outputs/example.com/report.md`

### CLI Options

```bash
node audit.js <url> [options]
```

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--output <dir>` | `-o` | `./outputs` | Custom output directory |
| `--pages <n>` | `-p` | `3` | Maximum number of pages to audit |
| `--help` | `-h` | | Show help |
| `--version` | | | Show version |

### Examples

```bash
# Audit with custom output directory
node audit.js https://example.com --output ./reports

# Audit only the homepage
node audit.js https://example.com --pages 1

# Short flags
node audit.js https://example.com -o ./reports -p 2

# URL without protocol (https:// is added automatically)
node audit.js example.com
```

---

## 📂 Output Structure

Each audit generates a directory under `outputs/{domain}/`:

```
outputs/example.com/
├── report.md                              # The full Markdown audit report
├── screenshots/
│   ├── homepage-desktop.png               # Desktop screenshot
│   ├── homepage-mobile.png                # Mobile screenshot  
│   ├── contact-desktop.png
│   ├── contact-mobile.png
│   ├── services-desktop.png
│   └── services-mobile.png
└── lighthouse/
    ├── homepage.json                      # Raw Lighthouse data
    ├── contact.json
    └── services.json
```

### Report Sections

The generated `report.md` includes:

1. **Executive Summary** — issue counts by severity (High / Medium / Low)
2. **Lighthouse Scores** — Performance, Accessibility, and SEO scores per page
3. **Key Issues** — all detected issues with severity, source, and recommendations
4. **Page Breakdown** — per-page details with screenshots, scores, and issues

---

## 🤖 Vision Analysis

When a `GEMINI_API_KEY` is configured, AuditLab sends desktop screenshots to Google Gemini for automated UI/UX analysis.

### What It Detects

| Category | Examples |
|----------|----------|
| **Layout Issues** | Broken layouts, overlapping elements, excessive whitespace |
| **Readability** | Poor contrast, tiny text, missing visual hierarchy |
| **CTA Issues** | Missing calls-to-action, unclear buttons, poor placement |
| **Responsiveness** | Mobile layout problems, overflow issues |
| **Accessibility** | Missing alt text indicators, poor color contrast |

### Issue Format

Each issue includes:
- **Issue** — concise description of the problem
- **Severity** — `High` (blocks usability), `Medium` (degrades UX), `Low` (cosmetic)
- **Recommendation** — specific, actionable fix

### Changing the Vision Model

Update `GEMINI_MODEL` in your `.env` file. Available vision-capable models:

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `gemini-2.5-flash` | ⚡ Fast | Good | Low |
| `gemini-2.5-pro` | 🐢 Slower | Best | Higher |
| `gemini-1.5-flash` | ⚡ Fast | Good | Low |
| `gemini-1.5-pro` | 🐢 Slower | Great | Medium |

Browse all models at [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models).

---

## 🏗️ Architecture

```
audit.js                  CLI entry point & pipeline orchestrator
  │
  ├── src/crawler.js      Page discovery (keyword matching + fallback)
  ├── src/browser.js      Playwright browser lifecycle
  ├── src/screenshot.js   Dual-viewport screenshot capture
  ├── src/lighthouse.js   Lighthouse audit runner (via chrome-launcher)
  ├── src/vision.js       Google Gemini vision analysis
  ├── src/aggregator.js   Issue merging & deduplication
  └── src/report.js       Markdown report generator
```

### Pipeline Flow

```
URL → Discover Pages → Capture Screenshots → Run Lighthouse → Vision Analysis → Aggregate Issues → Generate Report
```

All steps are sequential. Failed pages are skipped and the pipeline continues.

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: Chromium not found` | Run `npx playwright install chromium` |
| `Vision: 404 model not found` | Update `GEMINI_MODEL` in `.env` (check [available models](https://ai.google.dev/gemini-api/docs/models)) |
| `Vision: No API key set` | Add `GEMINI_API_KEY` to your `.env` file |
| Lighthouse timeout | The target site may be slow — audit will continue with other pages |
| Screenshots are blank | Some JS-heavy sites need longer load times — try again |

---

## 📋 Limitations

- Audits up to 3 pages per run (configurable via `--pages`)
- Vision analysis may have minor inaccuracies
- Sites behind authentication are not supported
- Very large or JS-heavy SPAs may have incomplete screenshots

---

## 🛣️ Roadmap

- [ ] Full site crawling
- [ ] Web dashboard UI
- [ ] Batch processing (multiple URLs)
- [ ] PDF report export
- [ ] Historical comparison (track scores over time)

---

## 📄 License

MIT