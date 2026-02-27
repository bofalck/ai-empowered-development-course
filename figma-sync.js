#!/usr/bin/env node

/**
 * Figma Design Tokens Sync
 * Fetches design tokens from Figma and generates CSS variables
 */

import fs from 'fs';
import https from 'https';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || 'figd_nXA1HN-sJLpKkEWpY6_TYQaO1BqEMrMcvkBkdDWl';
const FIGMA_FILE_ID = 'SFZTUUfnDJBBkNpLDWubVn';
const FIGMA_API_URL = `https://api.figma.com/v1/files/${FIGMA_FILE_ID}`;

/**
 * Make HTTPS request to Figma API
 */
function fetchFromFigma(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'X-Figma-Token': FIGMA_TOKEN,
                'Content-Type': 'application/json',
            },
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Figma API error: ${res.statusCode} - ${data}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Extract design tokens from Figma components
 */
function extractTokens(fileData) {
    const tokens = {
        colors: {},
        typography: {},
        spacing: {},
    };

    // Extract from components
    if (fileData.components) {
        Object.entries(fileData.components).forEach(([id, component]) => {
            const name = component.name.toLowerCase();

            // Extract colors from component names like "color/primary"
            if (name.includes('color/')) {
                const colorName = name.split('color/')[1];
                const fills = component.fills;
                if (fills && fills.length > 0) {
                    const fill = fills[0];
                    if (fill.color) {
                        const rgb = fill.color;
                        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                        tokens.colors[colorName] = hex;
                    }
                }
            }

            // Extract typography from component names like "typography/body"
            if (name.includes('typography/')) {
                const typeName = name.split('typography/')[1];
                if (component.type === 'TEXT') {
                    tokens.typography[typeName] = {
                        font: component.fontFamily || 'inherit',
                        size: component.fontSize || '1rem',
                        weight: component.fontWeight || '400',
                        lineHeight: component.lineHeightPercent ? `${component.lineHeightPercent}%` : 'normal',
                    };
                }
            }

            // Extract spacing from component names like "spacing/md"
            if (name.includes('spacing/')) {
                const spacingName = name.split('spacing/')[1];
                if (component.absoluteBoundingBox) {
                    const size = component.absoluteBoundingBox.width;
                    tokens.spacing[spacingName] = `${size}px`;
                }
            }
        });
    }

    return tokens;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate CSS variables from tokens
 */
function generateCSSVariables(tokens) {
    let css = ':root {\n';

    // Colors
    Object.entries(tokens.colors).forEach(([name, value]) => {
        css += `    --color-${name}: ${value};\n`;
    });

    // Typography
    Object.entries(tokens.typography).forEach(([name, props]) => {
        css += `    --font-${name}: ${props.font};\n`;
        css += `    --font-size-${name}: ${props.size};\n`;
        css += `    --font-weight-${name}: ${props.weight};\n`;
    });

    // Spacing
    Object.entries(tokens.spacing).forEach(([name, value]) => {
        css += `    --spacing-${name}: ${value};\n`;
    });

    css += '}\n';
    return css;
}

/**
 * Main sync function
 */
async function syncDesignTokens() {
    try {
        console.log('🎨 Fetching design tokens from Figma...');
        const fileData = await fetchFromFigma(FIGMA_API_URL);

        console.log('📊 Extracting tokens...');
        const tokens = extractTokens(fileData);

        console.log('✅ Generated tokens:');
        console.log('   Colors:', Object.keys(tokens.colors).length);
        console.log('   Typography:', Object.keys(tokens.typography).length);
        console.log('   Spacing:', Object.keys(tokens.spacing).length);

        const cssVariables = generateCSSVariables(tokens);

        // Log sample output
        console.log('\n📝 Sample CSS Variables:');
        console.log(cssVariables.split('\n').slice(0, 10).join('\n'));

        // Save to file
        const tokensFile = 'figma-tokens.json';
        fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
        console.log(`\n✅ Tokens saved to ${tokensFile}`);

        console.log('\n✨ Design tokens sync complete!');
        console.log('Next: Review tokens and update styles.css manually or create an automation script');
    } catch (error) {
        console.error('❌ Error syncing design tokens:', error.message);
        process.exit(1);
    }
}

// Run sync
syncDesignTokens();
