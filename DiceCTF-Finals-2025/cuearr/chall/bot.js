const puppeteer = require("puppeteer");

const SITE = "http://localhost:3000";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const visit = async (url, token, log) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--jitless",
            ],
            dumpio: true
        });

        const ctx = await browser.createBrowserContext();
        let page = await ctx.newPage();

        await page.goto(SITE, { timeout: 3000, waitUntil: 'domcontentloaded' });
        await page.evaluate((token) => {
            document.querySelector("textarea[name=content]").value = token;
            document.querySelector("input[type=submit]").click();
        }, token);
        log("token saved");
        await sleep(3000);

        await page.close();
        page = await ctx.newPage();

        log("visiting your url");
        await page.goto(url, { timeout: 3000, waitUntil: 'domcontentloaded' });
        await sleep(10_000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
        log("an error occurred");
    } finally {
        if (browser) await browser.close();
    }
    log("visit completed");
};

module.exports = { visit };