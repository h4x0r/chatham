#!/usr/bin/env node

/**
 * Export Excalidraw diagrams to PNG
 *
 * Uses excalidraw-brute-export-cli to automate PNG exports.
 * Run: node scripts/export-excalidraw.mjs
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const diagrams = [
  { input: 'security-model.excalidraw', output: 'security-model.png' },
  { input: 'chatham-house-model.excalidraw', output: 'chatham-house-model.png' }
];

console.log('🎨 Excalidraw PNG Export Tool\n');

for (const { input, output } of diagrams) {
  console.log(`📤 Exporting ${input}...`);

  const inputPath = join(projectRoot, 'docs/images', input);
  const outputPath = join(projectRoot, 'docs/images', output);

  try {
    execSync(
      `npx excalidraw-brute-export-cli -i "${inputPath}" -o "${outputPath}" --format png --scale 2 --background 1`,
      { stdio: 'inherit', cwd: projectRoot }
    );
    console.log(`✅ ${output} exported\n`);
  } catch (error) {
    console.error(`❌ Failed to export ${input}:`, error.message);
    process.exit(1);
  }
}

console.log('✅ All diagrams exported successfully!');
