const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto('https://www.opieoils.co.uk/c-647-engine-oil-by-grade-viscosity.aspx');
    let count = 1;
    await page.screenshot({
        path: `../opieoils-${count++}.png`
    });
    await page.$('a.category-name,h2.productResultName > a').each(async () => {
        const href = $(this).attr('href');
        if (href) {
            console.log(href);
            await page.goto(href);
            await page.screenshot({
                path: `../opieoils-${count++}.png`
            });
        }
    });
    await browser.close();
})();