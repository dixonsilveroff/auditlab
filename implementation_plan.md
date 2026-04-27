# Switch from Google AI Studio to Google Vertex Studio

This plan details the migration from the deprecated `@google/generative-ai` SDK (Google AI Studio) to the modern `@google/genai` SDK configured for Vertex AI. 

## User Review Required

> [!WARNING]
> Switching to Vertex AI requires Google Cloud Platform (GCP) credentials instead of an AI Studio API key. 
> Please follow the **Vertex AI Setup Guide** below to configure your environment. Once you have completed the steps and added the variables to your `.env` file, let me know, and I will execute the code changes!

---

## Vertex AI Setup Guide

### Step 1: Create a Google Cloud Project & Enable Vertex AI
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project drop-down at the top left and select **New Project**.
3. Name your project (e.g., `auditlab-vertex`) and click **Create**.
4. Once created, make sure your new project is selected in the top left.
5. Search for **Vertex AI API** in the top search bar, click on it, and click **Enable**.
6. Note down your **Project ID** (it usually looks like `project-name-123456`). 
7. **Regarding Location:** You don't need to configure a default location in the Google Cloud UI. You simply pick an available Vertex AI region (like `us-central1`, `us-east4`, or `europe-west4`) and set it in your code. We'll use `us-central1` for this app.
8. Open your `.env` file and add the following lines, replacing `your-project-id` with your actual Project ID:
   ```env
   VERTEX_PROJECT_ID=your-project-id
   VERTEX_LOCATION=us-central1
   ```

### Step 2: Install the Google Cloud CLI
To authenticate your local machine, you need the Google Cloud CLI.
1. Download the Google Cloud CLI installer for Windows: [Google Cloud CLI for Windows](https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe).
2. Run the installer and follow the prompts. Make sure the option to **Start the Google Cloud CLI** is checked at the end.
3. In the terminal that opens, it will ask you to log in. Follow the prompts to authenticate via your web browser.

### Step 3: Set up Application Default Credentials (ADC)
This is how the Node.js SDK securely authenticates with Google Cloud without hardcoding keys.
1. Open a new PowerShell or Command Prompt window (to ensure the `gcloud` command is in your PATH).
2. Run the following command to log in and set up your local credentials:
   ```bash
   gcloud auth application-default login
   ```
3. A browser window will open asking you to authenticate. Choose the Google account associated with your Google Cloud Project and allow the necessary permissions.
4. Finally, set your project as the default project for the CLI by running:
   ```bash
   gcloud config set project your-project-id
   ```

---

## Proposed Code Changes

Once you've completed the setup above, I will execute the following changes:

### Dependencies

#### [MODIFY] [package.json](file:///c:/Users/Vick/Dev/GitHub/auditlab/package.json)
- Uninstall `@google/generative-ai`
- Install `@google/genai`

### Configuration

#### [MODIFY] [.env](file:///c:/Users/Vick/Dev/GitHub/auditlab/.env)
- The old `GEMINI_API_KEY` will be removed once migration is verified.

### Core Logic

#### [MODIFY] [vision.js](file:///c:/Users/Vick/Dev/GitHub/auditlab/src/vision.js)
- Update imports: replace `GoogleGenerativeAI` with `GoogleGenAI` from `@google/genai`.
- Initialize the client with Vertex AI settings:
  ```javascript
  const ai = new GoogleGenAI({
    vertexai: {
      project: process.env.VERTEX_PROJECT_ID,
      location: process.env.VERTEX_LOCATION,
    }
  });
  ```
- Refactor the `generateContent` method call to align with the new SDK's format.
  - Convert `_model.generateContent([VISION_PROMPT, { inlineData: ... }])` to `ai.models.generateContent({ model: ..., contents: [VISION_PROMPT, { inlineData: ... }] })`.
- Update response handling: access the output using the `.text` property.

## Verification Plan

### Automated/Local Tests
- I will run `npm install` to update dependencies.
- We will trigger an audit using `npm start` against a test URL to ensure the screenshot is successfully analyzed by Vertex AI without errors.
