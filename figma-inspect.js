#!/usr/bin/env node

import https from 'https';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || 'figd_nXA1HN-sJLpKkEWpY6_TYQaO1BqEMrMcvkBkdDWl';
const FIGMA_FILE_ID = 'SFZTUUfnDJBBkNpLDWubVn';
const FIGMA_API_URL = `https://api.figma.com/v1/files/${FIGMA_FILE_ID}`;

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
                    reject(new Error(`Figma API error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

async function inspectFigma() {
    try {
        console.log('🔍 Inspecting Figma file structure...\n');
        const fileData = await fetchFromFigma(FIGMA_API_URL);

        // Check for components
        console.log('Components:', Object.keys(fileData.components || {}).length);
        if (fileData.components) {
            console.log('Sample components:');
            Object.entries(fileData.components).slice(0, 5).forEach(([id, comp]) => {
                console.log(`  - ${comp.name}`);
            });
        }

        // Check for styles
        console.log('\nStyles:', Object.keys(fileData.styles || {}).length);
        if (fileData.styles) {
            console.log('Sample styles:');
            Object.entries(fileData.styles).slice(0, 5).forEach(([id, style]) => {
                console.log(`  - ${style.name}`);
            });
        }

        // Check for variables (if available)
        console.log('\nVariables:', fileData.variables ? Object.keys(fileData.variables).length : 'N/A');

        // Check document structure
        console.log('\nDocument structure:');
        console.log('Pages:', fileData.document?.children?.length || 0);
        if (fileData.document?.children) {
            fileData.document.children.forEach((page) => {
                console.log(`  - ${page.name}`);
            });
        }

        console.log('\n✅ File structure inspection complete');
        console.log('\nNext: Update figma-sync.js to match your actual token structure');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

inspectFigma();
