// npm i puppeteer
const puppeteer = require("puppeteer");

const TEST_USER = "test_user";
const TEST_PASSWORD = "test_password";
const FLAG = "corctf{test_flag}";
const SITE = "https://iframe-note.be.ax";

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}

const visit = async (url) => {
    if (!/^https:\/\/iframe-note\.be\.ax\/view\?id=[A-Fa-f0-9]+$/.test(url)) {
        console.log('[warning]: invalid url! you cannot submit this to the admin bot.');
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--noexpose_wasm,--jitless",
            ],
            dumpio: true
        });

        const ctx = browser.createBrowserContext();

        const page = await ctx.newPage();
        await page.goto(`${SITE}/login`, { timeout: 5000, waitUntil: 'networkidle2' });

        await page.evaluate((flag) => {
            localStorage.setItem("flag", flag);
        }, FLAG);

        await page.waitForSelector('input[name="username"]', { timeout: 5000 });

        await page.type('input[name="username"]', TEST_USER);
        await page.type('input[name="password"]', TEST_PASSWORD);
        await page.click('input[type="submit"]');
        
        await sleep(3000);
        await page.goto(url, { timeout: 5000, waitUntil: 'networkidle2' });

        await sleep(8000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

visit("TARGET_URL");