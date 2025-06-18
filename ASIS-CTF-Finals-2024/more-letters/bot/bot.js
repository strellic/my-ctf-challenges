#!/usr/bin/env node
const puppeteer = require('puppeteer')
const flag = process.env.FLAG ?? 'ASIS{test-flag}'

async function sleep(n){
	return new Promise((r)=>setTimeout(r,n))
}

async function visit(url){
	let browser
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
		})

		let page = await browser.newPage()
		await page.goto('https://web/')
		await page.setCookie({
			httpOnly: false,
			name: 'flag',
			value: flag,
			sameSite: 'Lax',
			secure: true
		})
		await page.close()

		page = await browser.newPage()
		await page.goto(url, {timeout: 2000, waitUntil: 'domcontentloaded'})
		await sleep(3000)
		await page.close()
	} catch(e) {
		console.log(e)
	}
	try{ await browser.close() } catch {}
}

visit(JSON.parse(process.argv[2]))
