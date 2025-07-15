// npm i puppeteer
// script to emulate admin bot

const puppeteer = require("puppeteer");

const FLAG = "dice{test_flag}";
const SITE = "https://connections.dicec.tf";

const visit = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--noexpose_wasm,--jitless",
            ],
            dumpio: true
        });

        const ctx = await browser.createBrowserContext();

        let page = await ctx.newPage();
        await page.goto(SITE, { timeout: 3000, waitUntil: 'domcontentloaded' });

        await page.evaluate((flag) => {
           document.cookie = "FLAG=" + flag;
        }, FLAG);
        await new Promise(r => setTimeout(r, 3000));

        await page.close();
        page = await ctx.newPage();

        await page.goto(url, { timeout: 3000, waitUntil: 'domcontentloaded' })
        await new Promise(r => setTimeout(r, 5000));

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

visit("TARGET_URL");