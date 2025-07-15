import flag from './flag.txt';

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export default {
  name: 'connections admin bot',
  timeout: 15_000,
  handler: async (url, ctx) => {
    let page = await ctx.newPage();
    await page.goto(`https://connections.dicec.tf`, { timeout: 3000, waitUntil: 'domcontentloaded' });
    await page.evaluate((flag) => {
      document.cookie = "FLAG=" + flag;
    }, flag);
    await sleep(3000);
    await page.close();
    page = await ctx.newPage();
    await page.goto(url, { timeout: 3000, waitUntil: 'domcontentloaded' });
    await sleep(5000);
  }
}