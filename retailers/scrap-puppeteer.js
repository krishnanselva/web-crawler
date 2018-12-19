const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.opieoils.co.uk/c-647-engine-oil-by-grade-viscosity.aspx');
    await page.screenshot({ path: '../opieoils.png' });
    await browser.close();
})();