// @ts-check
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup to fetch test URLs before running tests
 */
async function globalSetup() {
    console.log('=== Global Setup: Fetching test URLs ===');

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to the main page
        await page.goto('http://localhost:5173/');
        await page.waitForSelector('.run-test-link', { timeout: 30000 });

        // Find all test links and extract their hrefs
        const links = await page.locator('.run-test-link').all();
        const hrefs = [];

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (href) {
                hrefs.push(href);
            }
        }

        console.log(`Fetched ${hrefs.length} test URLs:`, hrefs);

        // Save hrefs to a JSON file that tests can read
        const testDataPath = path.join(process.cwd(), 'tests', 'test-urls.json');
        fs.writeFileSync(testDataPath, JSON.stringify({ hrefs }, null, 2));

        console.log(`Test URLs saved to: ${testDataPath}`);
    } catch (error) {
        console.error('Error in global setup:', error);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}

export default globalSetup;
