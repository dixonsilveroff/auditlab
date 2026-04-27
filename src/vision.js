// src/vision.js — AI vision analysis of screenshots using Google Gemini
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const VALID_SEVERITIES = ['High', 'Medium', 'Low'];
const VALID_CATEGORIES = ['ux', 'branding'];

let _client = null;

const VISION_PROMPT = `You are a senior UI/UX and brand strategy auditor. Analyze this website screenshot.

STEP 1 — INFER CONTEXT:
From the visual design, content, and imagery, infer:
- What business/industry this website represents
- Who the target customer likely is (demographics, goals, pain points)
- The intended brand personality and tone

STEP 2 — AUDIT:
Identify issues in TWO categories:

A) UX Issues (tag category as "ux"):
1. Layout issues (broken layouts, overlapping elements, excessive whitespace BETWEEN content sections — do NOT flag large empty areas at the very bottom of a page, as those are typically caused by lazy-loaded or scroll-triggered content that has not rendered in the screenshot)
2. Readability problems (poor contrast, tiny text, missing hierarchy)
3. CTA issues (missing calls-to-action, unclear buttons, poor placement)
4. Mobile responsiveness issues (if applicable)
5. Accessibility concerns (missing alt text indicators, poor color contrast)

B) Branding & Targeting Issues (tag category as "branding"):
1. Does the visual design effectively communicate the brand personality?
2. Does the colour scheme, imagery, and typography suit the industry?
3. Is the messaging and tone appropriate for the target customer?
4. Are there trust signals that address likely customer concerns?
5. Does the content speak to the target customer's goals and pain points?
6. Is the overall impression professional and credible for this industry?

For each issue found, return a JSON array of objects with these fields:
- "category": one of "ux" or "branding"
- "issue": concise description of the problem
- "severity": one of "High", "Medium", or "Low"
  - High: blocks usability, trust, or is a critical accessibility/branding failure
  - Medium: degrades user experience or brand perception noticeably
  - Low: cosmetic or minor improvement
- "recommendation": specific, actionable fix

Return ONLY a valid JSON array. No markdown, no explanation, just the JSON.
Example: [{"category":"ux","issue":"...","severity":"...","recommendation":"..."}]
If there are no issues, return an empty array: []`;

/**
 * Analyze a screenshot using Google Gemini Vision.
 *
 * @param {string} imagePath - Path to the screenshot file
 * @returns {Promise<Array<{issue: string, severity: string, recommendation: string}>>}
 */
export async function analyzeScreenshot(imagePath) {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION;

  if (!projectId || !location) {
    console.warn('[vision] No VERTEX_PROJECT_ID or VERTEX_LOCATION set — skipping vision analysis');
    return [];
  }

  try {
    if (!_client) {
      _client = new GoogleGenAI({
        vertexai: {
          project: projectId,
          location: location,
        }
      });
    }

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = 'image/png';

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

    const response = await Promise.race([
      _client.models.generateContent({
        model: modelName,
        contents: [
          VISION_PROMPT,
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
        ]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Vision API timeout (75s)')), 75000)
      ),
    ]);

    const text = response.text;

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[vision] Could not parse vision response as JSON');
      return [];
    }

    const issues = JSON.parse(jsonMatch[0]);

    // Validate each issue object
    const validated = issues.filter((i) => {
      if (typeof i.issue !== 'string' || !i.issue.trim()) return false;
      if (typeof i.recommendation !== 'string' || !i.recommendation.trim()) return false;
      if (!VALID_SEVERITIES.includes(i.severity)) {
        if (typeof i.severity === 'string') {
          i.severity = 'Medium';
        } else {
          return false;
        }
      }
      // Normalize category (default to 'ux' if missing or invalid)
      if (!VALID_CATEGORIES.includes(i.category)) {
        i.category = 'ux';
      }
      return true;
    });

    console.log(`[vision] Found ${validated.length} issues in ${imagePath}`);
    return validated;
  } catch (error) {
    console.error(`[vision] Error analyzing ${imagePath}: ${error.message}`);
    return [];
  }
}
