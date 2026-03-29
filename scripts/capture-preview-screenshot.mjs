import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const targetUrl = process.env.SCREENSHOT_URL || 'http://127.0.0.1:4173/#/dashboard';
const outputPath = process.env.SCREENSHOT_OUT || 'artifacts/dashboard-preview.png';
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || undefined;

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
  await browser.close();

  console.log(`Screenshot saved to ${outputPath}`);
};

run().catch((error) => {
  console.error('Failed to capture screenshot:', error.message || error);
  console.error(
    'Hint: run `npx playwright install chromium`, or set CHROMIUM_EXECUTABLE_PATH to a local Chromium binary.'
  );
  process.exit(1);
});
