import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function exportExcalidrawToPNG(excalidrawFile, outputFile) {
  console.log(`\n📤 Exporting ${excalidrawFile} to ${outputFile}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2400, height: 1600 },
    deviceScaleFactor: 2 // 2x for retina
  });
  const page = await context.newPage();

  try {
    // Load the excalidraw file
    const excalidrawPath = join(projectRoot, 'docs', 'images', excalidrawFile);
    console.log(`  Reading ${excalidrawPath}...`);
    const excalidrawData = readFileSync(excalidrawPath, 'utf-8');
    const sceneData = JSON.parse(excalidrawData);

    // Encode the scene data for URL
    const sceneJson = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: sceneData.elements,
      appState: sceneData.appState || {}
    });

    const encodedScene = encodeURIComponent(Buffer.from(sceneJson).toString('base64'));

    // Load Excalidraw with the scene data in URL
    console.log('  Loading scene in Excalidraw...');
    const url = `https://excalidraw.com/#json=${encodedScene}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for canvas to be ready
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(3000); // Give it time to render

    // Get the canvas element
    console.log('  Capturing diagram...');
    const canvas = await page.locator('canvas').first();

    // Get canvas bounding box to crop appropriately
    const box = await canvas.boundingBox();

    if (!box) {
      throw new Error('Could not get canvas bounding box');
    }

    // Take screenshot of just the canvas area
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: box.x,
        y: box.y,
        width: Math.min(box.width, 2400),
        height: Math.min(box.height, 1600)
      }
    });

    // Save the PNG
    const outputPath = join(projectRoot, 'docs', 'images', outputFile);
    writeFileSync(outputPath, screenshot);
    console.log(`  ✅ Saved to ${outputPath}`);

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🎨 Excalidraw PNG Export Tool\n');

  try {
    // Export both diagrams
    await exportExcalidrawToPNG('security-model.excalidraw', 'security-model.png');
    await exportExcalidrawToPNG('chatham-house-model.excalidraw', 'chatham-house-model.png');

    console.log('\n✅ All diagrams exported successfully!');
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

main();
