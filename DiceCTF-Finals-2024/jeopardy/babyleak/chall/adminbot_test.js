// npm i puppeteer
// script to emulate admin bot

const puppeteer = require("puppeteer");
const crypto = require("crypto");

const SITE = "http://localhost:1337";
const FLAG = "dice{test_flag}";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const visit = async (url) => {
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

        let page = await browser.newPage();
        await page.goto(SITE + "/register", { timeout: 3000, waitUntil: 'domcontentloaded' });

        await page.type("input[name=user]", `admin-${crypto.randomUUID()}`);
        await page.type("input[name=pass]", crypto.randomUUID());
        await page.click("input[type=submit]");
        await page.waitForNavigation();

        await page.type("input[name=title]", `flag`);
        await page.type("input[name=note]", FLAG);
        await page.click("input[value=Create]");
        await page.waitForNavigation();

        await page.close();
        page = await browser.newPage();

        await page.goto(url, { timeout: 3000, waitUntil: 'domcontentloaded' })
        await sleep(30_000);

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

visit("EXPLOIT_PAGE");