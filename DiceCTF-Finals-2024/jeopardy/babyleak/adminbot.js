import crypto from 'crypto'

import flag from './flag.txt'

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export default {
  name: 'babyleak admin bot',
  urlRegex: /^https?:\/\/.*\//,
  timeout: 40000,
  handler: async (url, ctx) => {
    let page = await ctx.newPage();
    await page.goto("https://babyleak.mc.ax/register", { timeout: 3000, waitUntil: 'domcontentloaded' });

    await page.type("input[name=user]", `admin-${crypto.randomUUID()}`);
    await page.type("input[name=pass]", crypto.randomUUID());
    await page.click("input[type=submit]");
    await sleep(3_000);

    await page.type("input[name=title]", `flag`);
    await page.type("input[name=note]", flag);
    await page.click("input[value=Create]");
    await sleep(3_000);

    await page.close();
    page = await ctx.newPage();

    await page.goto(url, { timeout: 3000, waitUntil: 'domcontentloaded' })
    await sleep(30_000);
  }
}
