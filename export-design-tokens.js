#!/usr/bin/env node

/**
 * Export Design Tokens from CSS
 * Extracts current design system to JSON for Figma setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stylesPath = path.join(__dirname, 'styles.css');
const cssContent = fs.readFileSync(stylesPath, 'utf-8');

const tokens = {
  colors: {},
  typography: {},
  spacing: {},
  borderRadius: {},
  shadows: {},
};

// Extract :root CSS variables
const rootMatch = cssContent.match(/:root\s*{([^}]+)}/s);
if (rootMatch) {
  const rootVars = rootMatch[1];

  // Parse all CSS variables
  const varRegex = /--([^:]+):\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(rootVars)) !== null) {
    const varName = match[1].trim();
    const varValue = match[2].trim();

    // Categorize tokens
    if (varName.startsWith('color-')) {
      const colorName = varName.replace('color-', '').replace(/-(rgb|rgb-)/g, '');
      tokens.colors[colorName] = varValue;
    } else if (varName.startsWith('font-')) {
      const fontName = varName.replace('font-', '');
      if (!tokens.typography[fontName]) {
        tokens.typography[fontName] = {};
      }
      if (varName.includes('family')) {
        tokens.typography[fontName].family = varValue;
      } else if (varName.includes('size')) {
        tokens.typography[fontName].size = varValue;
      } else if (varName.includes('weight')) {
        tokens.typography[fontName].weight = varValue;
      }
    } else if (varName.startsWith('spacing-')) {
      const spacingName = varName.replace('spacing-', '');
      tokens.spacing[spacingName] = varValue;
    } else if (varName.startsWith('border-radius')) {
      const radiusName = varName.replace('border-radius-', '');
      tokens.borderRadius[radiusName] = varValue;
    } else if (varName.startsWith('shadow')) {
      const shadowName = varName.replace('shadow-', '');
      tokens.shadows[shadowName] = varValue;
    }
  }
}

// Generate output
const output = {
  name: 'Portfolio Design System',
  description: 'Bobby Falck Portfolio Design Tokens',
  exportedAt: new Date().toISOString(),
  tokens,
};

// Save to JSON
const outputPath = path.join(__dirname, 'design-tokens.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

// Also generate a Figma-ready format
const figmaFormat = {
  colors: Object.entries(tokens.colors).map(([name, value]) => ({
    name: `color/${name}`,
    value,
    type: 'color',
  })),
  typography: Object.entries(tokens.typography).map(([name, props]) => ({
    name: `typography/${name}`,
    ...props,
    type: 'typography',
  })),
  spacing: Object.entries(tokens.spacing).map(([name, value]) => ({
    name: `spacing/${name}`,
    value,
    type: 'spacing',
  })),
};

const figmaPath = path.join(__dirname, 'design-tokens-figma.json');
fs.writeFileSync(figmaPath, JSON.stringify(figmaFormat, null, 2));

// Print summary
console.log('📦 Design Tokens Exported\n');
console.log('📄 Files generated:');
console.log(`   ✓ design-tokens.json (structured format)`);
console.log(`   ✓ design-tokens-figma.json (Figma import format)\n`);

console.log('🎨 Colors:', Object.keys(tokens.colors).length);
console.log('📝 Typography:', Object.keys(tokens.typography).length);
console.log('📏 Spacing:', Object.keys(tokens.spacing).length);
console.log('🔘 Border Radius:', Object.keys(tokens.borderRadius).length);
console.log('🌟 Shadows:', Object.keys(tokens.shadows).length);

console.log('\n📋 Sample tokens:\n');
console.log('Colors:');
Object.entries(tokens.colors).slice(0, 3).forEach(([name, value]) => {
  console.log(`  ${name}: ${value}`);
});

console.log('\nTypography:');
Object.entries(tokens.typography).slice(0, 3).forEach(([name, props]) => {
  console.log(`  ${name}:`, props);
});

console.log('\nSpacing:');
Object.entries(tokens.spacing).slice(0, 3).forEach(([name, value]) => {
  console.log(`  ${name}: ${value}`);
});

console.log('\n✨ Next: Open design-tokens-figma.json to copy to Figma');
console.log('📌 Use these to set up Figma Variables or Components');
