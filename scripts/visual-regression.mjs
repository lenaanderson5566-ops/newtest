import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const baseUrl = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4173';
const updateBaseline = process.env.VISUAL_UPDATE_BASELINE === '1';

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 }
};

const routes = [
  { name: 'docs', path: '/#/docs', threshold: 0.003 },
  { name: 'docdetail', path: '/#/docs/1', threshold: 0.003 },
  { name: 'dashboard', path: '/#/dashboard', threshold: 0.002 }
];

const root = process.cwd();
const baselineDir = path.join(root, 'tests/visual/baseline');
const currentDir = path.join(root, 'tests/visual/current');
const diffDir = path.join(root, 'tests/visual/diff');
const reportPath = path.join(root, 'tests/visual/report.json');

for (const dir of [baselineDir, currentDir, diffDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const readPng = (filePath) => PNG.sync.read(fs.readFileSync(filePath));
const writePng = (filePath, png) => fs.writeFileSync(filePath, PNG.sync.write(png));

const buildName = (routeName, viewportName) => `${routeName}-${viewportName}.png`;

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const report = [];
  let hasFailure = false;

  try {
    for (const route of routes) {
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        const page = await browser.newPage({ viewport });
        const filename = buildName(route.name, viewportName);
        const baselinePath = path.join(baselineDir, filename);
        const currentPath = path.join(currentDir, filename);
        const diffPath = path.join(diffDir, filename);

        await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: currentPath, fullPage: true });
        await page.close();

        if (!fs.existsSync(baselinePath) || updateBaseline) {
          fs.copyFileSync(currentPath, baselinePath);
          report.push({
            route: route.name,
            viewport: viewportName,
            status: 'baseline_updated',
            threshold: route.threshold,
            diffRatio: 0
          });
          continue;
        }

        const baseline = readPng(baselinePath);
        const current = readPng(currentPath);

        if (baseline.width !== current.width || baseline.height !== current.height) {
          hasFailure = true;
          report.push({
            route: route.name,
            viewport: viewportName,
            status: 'failed',
            reason: 'dimension_mismatch',
            threshold: route.threshold,
            baseline: `${baseline.width}x${baseline.height}`,
            current: `${current.width}x${current.height}`
          });
          continue;
        }

        const diff = new PNG({ width: baseline.width, height: baseline.height });
        const changed = pixelmatch(
          baseline.data,
          current.data,
          diff.data,
          baseline.width,
          baseline.height,
          { threshold: 0.1 }
        );

        const total = baseline.width * baseline.height;
        const diffRatio = changed / total;

        if (changed > 0) {
          writePng(diffPath, diff);
        }

        const status = diffRatio > route.threshold ? 'failed' : 'passed';
        if (status === 'failed') {
          hasFailure = true;
        }

        report.push({
          route: route.name,
          viewport: viewportName,
          status,
          threshold: route.threshold,
          diffRatio,
          changedPixels: changed,
          totalPixels: total,
          artifacts: {
            baseline: path.relative(root, baselinePath),
            current: path.relative(root, currentPath),
            diff: changed > 0 ? path.relative(root, diffPath) : null
          }
        });
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (hasFailure) {
    console.error('Visual regression check failed. See tests/visual/report.json for details.');
    process.exit(1);
  }

  console.log('Visual regression check passed.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
