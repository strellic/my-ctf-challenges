const puppeteer = require("puppeteer");
const crypto = require("crypto");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ext = './extension/dist/';

const FLAG_WEBSITE = process.env.FLAG_WEBSITE ?? "https://dicega.ng";
const FLAG = process.env.FLAG ?? "dice{test_flag}";

const visit = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--jitless",
                `--disable-extensions-except=${ext}`,
                `--load-extension=${ext}`
            ],
            dumpio: true
        });

        // grab the extension ID
        let page = await browser.newPage();
        await page.goto("https://example.com", { timeout: 5000, waitUntil: 'load' });
        const extensionId = await page.evaluate(() => window.dicepass.extensionId);

        // get the extension popup page
        await page.goto("chrome-extension://" + extensionId + "/popup.html?", { timeout: 5000, waitUntil: 'load' });
        await page.evaluate(() => chrome.action.openPopup());
        const popup = await browser.waitForTarget(t => t.url() === "chrome-extension://" + extensionId + "/popup.html");
        const popupPage = await popup.asPage();
        
        // set master password
        await popupPage.type("#register-form input[type=password]", crypto.randomBytes(16).toString("hex"));
        await popupPage.click("#register-form button[type=submit]");
        await sleep(1500);

        // add flag as a password
        await popupPage.type("#new-form input[type=url]", FLAG_WEBSITE);
        await popupPage.type("#new-form input[type=text]", "flag");
        await popupPage.type("#new-form input[type=password]", FLAG);
        await popupPage.click("#new-form button[type=submit]");
        await sleep(1500);
        await page.close();

        // go to the exploit website
        page = await browser.newPage();
        await page.goto(url, { timeout: 5000, waitUntil: 'load' });
        await sleep(15_000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { visit };