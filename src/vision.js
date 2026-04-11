// src/vision.js — AI vision analysis of screenshots using Google Gemini
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VISION_PROMPT = `You are a senior UI/UX auditor. Analyze this website screenshot and identify issues.

For each issue found, return a JSON array of objects with these fields:
- "issue": concise description of the problem
- "severity": one of "High", "Medium", or "Low"
  - High: blocks usability or is a critical accessibility issue
  - Medium: degrades user experience noticeably
  - Low: cosmetic or minor improvement
- "recommendation": specific, actionable fix

Focus on:
1. Layout issues (broken layouts, overlapping elements, excessive whitespace)
2. Readability problems (poor contrast, tiny text, missing hierarchy)
3. CTA issues (missing calls-to-action, unclear buttons, poor placement)
4. Mobile responsiveness issues (if applicable)
5. Accessibility concerns (missing alt text indicators, poor color contrast)

Return ONLY a valid JSON array. No markdown, no explanation, just the JSON.
Example: [{"issue":"...", "severity":"...", "recommendation":"..."}]
If there are no issues, return an empty array: []`;

/**
 * Analyze a screenshot using Google Gemini Vision.
 *
 * @param {string} imagePath - Path to the screenshot file
 * @returns {Promise<Array<{issue: string, severity: string, recommendation: string}>>}
 */
export async function analyzeScreenshot(imagePath) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[vision] No GEMINI_API_KEY set — skipping vision analysis');
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    const model = genAI.getGenerativeModel({ model: modelName });

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = 'image/png';

    const result = await model.generateContent([
      VISION_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[vision] Could not parse vision response as JSON');
      return [];
    }

    const issues = JSON.parse(jsonMatch[0]);
    console.log(`[vision] Found ${issues.length} issues in ${imagePath}`);
    return issues;
  } catch (error) {
    console.error(`[vision] Error analyzing ${imagePath}: ${error.message}`);
    return [];
  }
}
