// npm i puppeteer
const puppeteer = require("puppeteer");

const TEST_USER = "test_user";
const TEST_PASSWORD = "test_password";
const SITE = "https://repayment-pal-[INSTANCE_ID].be.ax";

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}

const visit = async (url) => {
    const urlObj = new URL(url);
    if (urlObj.origin !== SITE) {
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

        await page.waitForSelector('input[placeholder="Password"]', { timeout: 5000 });
    
        await page.type('input[placeholder="Username"]', TEST_USER);
        await page.type('input[placeholder="Password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        
        await sleep(3000);
        await page.goto(url, { timeout: 5000, waitUntil: 'networkidlev' });
    
        await sleep(5000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

visit("TARGET_URL");