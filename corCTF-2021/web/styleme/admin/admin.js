const puppeteer = require("puppeteer");
const path = require("path");

let ext = path.resolve(__dirname, "./extension/");

let queue = [];
const addToQueue = (url) => queue.push(url);

const TIMEOUT = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 8000;
const DELAY = process.env.DELAY ? parseInt(process.env.DELAY) : 500;

const visit = (url) => {
    let browser, page;
    return new Promise(async (resolve, reject) => {
        try {
            browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    `--disable-extensions-except=${ext}`,
                    `--load-extension=${ext}`
                ],
                dumpio: true,
                executablePath: process.env.PUPPETEER_EXEC_PATH
            });
            page = await browser.newPage();
            await page.goto(url, {
                waitUntil: "networkidle2"
            });
            await page.waitForTimeout(TIMEOUT);
            await page.close();
            await browser.close();
            page = null;
            browser = null;
        } catch (err) {
            console.log(err);
        } finally {
            if (page) await page.close();
            if (browser) await browser.close();
            resolve();
        }
    });
};

const loop = async () => {
    while (true) {
        let url = queue.shift();
        if (url) {
            console.log("vistiting:", url, queue);
            await visit(url);
        }
        await new Promise((resolve, reject) => setTimeout(resolve, DELAY));
    }
};

loop();
module.exports = {
    addToQueue
};