// src/aggregator.js — Merge and deduplicate issues from Lighthouse + Vision

/**
 * Convert Lighthouse scores into structured issues.
 * @param {{ performance: number, accessibility: number, seo: number } | null} scores
 * @param {string} pageName
 * @returns {Array<{issue: string, severity: string, recommendation: string, source: string, page: string, category: string}>}
 */
function lighthouseToIssues(scores, pageName) {
  if (!scores) return [];

  const issues = [];

  if (scores.performance < 50) {
    issues.push({
      issue: `Poor performance score (${scores.performance}/100)`,
      severity: 'High',
      recommendation: 'Optimize images, reduce JavaScript bundle size, enable caching, and minimize render-blocking resources.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  } else if (scores.performance < 80) {
    issues.push({
      issue: `Moderate performance score (${scores.performance}/100)`,
      severity: 'Medium',
      recommendation: 'Consider lazy-loading images, optimizing web fonts, and reviewing third-party scripts.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  }

  if (scores.accessibility < 50) {
    issues.push({
      issue: `Poor accessibility score (${scores.accessibility}/100)`,
      severity: 'High',
      recommendation: 'Add missing ARIA labels, ensure sufficient color contrast, and provide alt text for images.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  } else if (scores.accessibility < 80) {
    issues.push({
      issue: `Moderate accessibility score (${scores.accessibility}/100)`,
      severity: 'Medium',
      recommendation: 'Review color contrast ratios, add missing form labels, and improve keyboard navigation.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  }

  if (scores.seo < 50) {
    issues.push({
      issue: `Poor SEO score (${scores.seo}/100)`,
      severity: 'High',
      recommendation: 'Add meta descriptions, ensure proper heading hierarchy, and fix crawlability issues.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  } else if (scores.seo < 80) {
    issues.push({
      issue: `Moderate SEO score (${scores.seo}/100)`,
      severity: 'Medium',
      recommendation: 'Improve meta tags, add structured data, and verify mobile-friendliness.',
      source: 'lighthouse',
      page: pageName,
      category: 'ux',
    });
  }

  return issues;
}

/**
 * Simple text similarity check for deduplication.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSimilar(a, b) {
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).sort().join(' ');
  const wordsA = normalize(a).split(' ');
  const wordsB = normalize(b).split(' ');
  const common = wordsA.filter((w) => wordsB.includes(w));
  const similarity = common.length / Math.max(wordsA.length, wordsB.length);
  return similarity > 0.6;
}

/**
 * Aggregate issues from Lighthouse and Vision, removing duplicates.
 *
 * @param {Object} lighthouseResults - Map of pageName -> scores
 * @param {Object} visionResults - Map of pageName -> Issue[]
 * @returns {Array<{issue: string, severity: string, recommendation: string, source: string, page: string, category: string}>}
 */
export function aggregateIssues(lighthouseResults, visionResults) {
  const allIssues = [];

  // Convert Lighthouse scores to issues
  for (const [pageName, scores] of Object.entries(lighthouseResults)) {
    allIssues.push(...lighthouseToIssues(scores, pageName));
  }

  // Add Vision issues
  for (const [pageName, issues] of Object.entries(visionResults)) {
    for (const issue of issues) {
      allIssues.push({
        ...issue,
        source: 'vision',
        page: pageName,
      });
    }
  }

  // Deduplicate by similarity
  const deduplicated = [];
  for (const issue of allIssues) {
    const isDuplicate = deduplicated.some(
      (existing) =>
        existing.page === issue.page && isSimilar(existing.issue, issue.issue)
    );
    if (!isDuplicate) {
      deduplicated.push(issue);
    }
  }

  // Sort by severity: High > Medium > Low
  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  deduplicated.sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  return deduplicated;
}
