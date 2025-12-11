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
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // 2x for retina
  });
  const page = await context.newPage();

  try {
    // Load Excalidraw
    console.log('  Opening excalidraw.com...');
    await page.goto('https://excalidraw.com', { waitUntil: 'networkidle' });

    // Wait for the app to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give it a moment to fully load

    // Read the excalidraw JSON file
    const excalidrawPath = join(projectRoot, 'docs', 'images', excalidrawFile);
    console.log(`  Loading ${excalidrawPath}...`);
    const excalidrawData = readFileSync(excalidrawPath, 'utf-8');

    // Inject the diagram data directly into Excalidraw's state
    // This is more reliable than using the file upload UI
    await page.evaluate((data) => {
      const parsedData = JSON.parse(data);
      // Excalidraw stores its data in window.EXCALIDRAW_ASSET_PATH
      // We need to trigger the import
      window.postMessage({
        type: 'excalidraw',
        payload: {
          type: 'SCENE_IMPORT',
          data: parsedData
        }
      }, '*');
    }, excalidrawData);

    await page.waitForTimeout(2000); // Let the diagram render

    // Zoom to fit all elements
    console.log('  Fitting diagram to view...');
    await page.keyboard.press('Control+0'); // or Command+0 on Mac
    await page.waitForTimeout(1000);

    // Take screenshot of the canvas
    console.log('  Capturing screenshot...');
    const canvas = await page.locator('canvas').first();
    const screenshot = await canvas.screenshot({
      type: 'png',
      scale: 'device' // Use device scale factor (2x)
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
