const puppeteer = require('puppeteer');

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log("Navigating to http://localhost:5173/");
        await page.goto("http://localhost:5173/");

        // Wait for the UI
        await page.waitForSelector('.btn-primary-sm');

        // Find the button to create a new template
        const buttons = await page.$$('.btn-primary-sm');
        if (buttons.length > 0) {
            console.log("Clicking 'New Template' button...");
            await buttons[0].click();
            await delay(2000);
        }

        await page.waitForSelector('.editor-topbar', { timeout: 10000 });
        console.log("Entered Editor View.");

        // Testing the dropdown groups
        const groups = await page.$$('.tb-group');
        console.log(`Found ${groups.length} toolbar dropdown groups.`);
        let successCount = 0;

        for (let i = 0; i < groups.length; i++) {
            const caret = await groups[i].$('.tb-caret');
            if (!caret) continue;

            console.log(`\nClicking caret for group ${i}...`);
            await caret.click();

            // wait a tiny bit for Vue reactivity
            await delay(400);

            const dropdown = await groups[i].$('.tb-dropdown');
            if (dropdown) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                }, dropdown);

                if (isVisible) {
                    console.log(`✅ Dropdown for group ${i} IS visible!`);
                    successCount++;

                    const items = await dropdown.$$('.tb-dd-item, .layout-chip');
                    console.log(`   Found ${items.length} clickable items in dropdown.`);

                    for (let j = 0; j < items.length; j++) {
                        if (j > 0) {
                            await caret.click();
                            await delay(200);
                        }
                        const currDropdown = await groups[i].$('.tb-dropdown');
                        if (currDropdown) {
                            const currItems = await currDropdown.$$('.tb-dd-item, .layout-chip');
                            if (currItems[j]) {
                                console.log(`   Clicking option ${j + 1}...`);
                                await currItems[j].click();
                                await delay(200);
                            }
                        }
                    }
                } else {
                    console.log(`❌ Dropdown for group ${i} exists in DOM but is hidden/zero opacity.`);
                }
            } else {
                console.log(`❌ Dropdown for group ${i} did not render in the DOM at all.`);
            }
        }

        if (successCount >= 3) {
            console.log("\n🎉 Test complete! Dropdowns successfully opened and items clicked.");
        } else {
            console.log("\n⚠️ Not all dropdowns opened correctly.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
