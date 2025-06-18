const puppeteer = require("puppeteer");

const PORT = process.env.PORT || 3000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const visit = async (secret, url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--jitless",
                "--enable-features=OverridePrivacySandboxSettingsLocalTesting",
                `--privacy-sandbox-enrollment-overrides=http://localhost:${PORT}`,
            ],
            dumpio: true,
            userDataDir: "/tmp/puppeteer",
        });

        const context = await browser.createBrowserContext();

        let page = await context.newPage();
        await page.goto(`http://localhost:${PORT}`, { timeout: 5000, waitUntil: 'domcontentloaded' });

        // save secret
        await page.waitForSelector("textarea[id=message]");
        await page.type("textarea[id=message]", secret);
        await page.click("input[type=submit]");
        await sleep(3000);
        await page.close();
  
        // go to exploit page
        page = await context.newPage();
        await page.goto(url, { timeout: 5000, waitUntil: 'domcontentloaded' });
        await sleep(90_000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { visit };