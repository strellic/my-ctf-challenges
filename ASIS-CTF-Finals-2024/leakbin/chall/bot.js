const puppeteer = require("puppeteer");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const SITE = `http://localhost:${PORT}`; // make sure to target this when attacking!

const FLAG = process.env.FLAG || "ASIS{test_flag}";
const FLAG_REGEX = /^ASIS{[a-z_]+}$/;

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const visit = (url) => {
    return new Promise(async (resolve, reject) => {
        if (!FLAG_REGEX.test(FLAG)) {
            return reject(new Error("Error: Flag does not match flag regex, contact an admin if this is on remote"));
        }

        let browser, context, page;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--js-flags=--noexpose_wasm,--jitless' // this is a web chall :)
                ],
                dumpio: true,
                pipe: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
            });

            // incognito btw
            context = await browser.createBrowserContext();

            page = await context.newPage();
            await page.goto(`${SITE}/register`, { waitUntil: "domcontentloaded", timeout: 5000 });
            await page.type("input[name=user]", `admin-${crypto.randomUUID()}`);
            await page.type("input[name=pass]", crypto.randomBytes(32).toString("hex"));
            await page.click("input[type=submit]");
            await sleep(1500);

            await page.type("input[name=title]", "Flag");
            await page.type("textarea[name=content]", FLAG);
            await page.click("form[action='/api/create'] input[type=submit]");
            await sleep(1500);

            await page.close();
        } catch (err) {
            console.error(err);
            if (browser) await browser.close();
            return reject(new Error("Error: Setup failed, if this happens consistently on remote contact an admin"));
        }

        resolve("The admin will visit your URL soon");

        try {
            page = await context.newPage();
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });
            await sleep(30_000);
        } catch (err) {
            console.error(err);
        }

        if (browser) await browser.close();
    });
};

module.exports = { visit };