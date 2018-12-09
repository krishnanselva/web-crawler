const { BehaviorSubject, from, of } = require('rxjs');
const { map, distinct, filter, mergeMap, share, catchError } = require('rxjs/operators');
const rp = require('request-promise-native');
const normalizeUrl = require('normalize-url');
const cheerio = require('cheerio');
const { resolve } = require('url');
const fs = require('fs');
const Product = require('./product');

var webScrapService = function () {
    const maxConcurrentReq = 5;
    const baseUrl = 'https://www.halfords.com/motoring/engine-oils-fluids/engine-oil';
    const fileName = '../halfords-engine-oil.csv';
    const allUrl$ = new BehaviorSubject(baseUrl);
    fs.unlink(fileName, (error) => {
        if (error) {
            console.log(`Failed to delete ${fileName}`);
        } else {
            console.log(`Deleted ${fileName}`);
        }
    });

    this.startScrap = () => {
        const product = new Product();
        writeToFile(getKeys(product));
        const uniqueUrl$ = allUrl$.pipe(
            // only crawl base url
            //   filter(url => url.includes(baseUrl)),
            // normalize url for comparison
            map(url => normalizeUrl(url, { removeTrailingSlash: true, removeQueryParameters: [], stripHash: true })),
            // distinct is a RxJS operator that filters out duplicated values
            distinct()
        );

        const urlAndDOM$ = uniqueUrl$.pipe(
            mergeMap(
                url => {
                    return from(rp(url)).pipe(
                        catchError(error => {
                            const { uri } = error.options;
                            console.log(`Error requesting ${uri}.`);
                            // return null on error
                            return of(null);
                        }),
                        filter(v => v),
                        // get the cheerio function $
                        map(html => cheerio.load(html)),
                        // add URL to the result. It will be used later for crawling
                        map($ => ({
                            $,
                            url
                        }))
                    );
                },
                null,
                maxConcurrentReq
            ),
            share()
        );

        // get all the next crawlable URLs
        urlAndDOM$.subscribe(scrapUrl);

    };

    scrapUrl: function scrapUrl({ url, $ }) {

        $('a.productModuleTitleLink,a.pageLink').each(function (i, elem) {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });
        if ($('#topSection > div.rightCol > h1')) {
            const title = getData($, '#topSection > div.rightCol > h1');
            if (title) {
                const titleArray = title.split(' ');
                const company = titleArray[0];
                const sellPrice = getData($, '#stickyAddToBasketPrice');
                const saving = getData($, '.savingValue');
                const wasPrice = getData($, '.wasValue');
                const grade = getData($, '#pdpMirakl > div:nth-child(3) > div.productInfoTabs > ul.tabContent > li.specificationDetails > table > tbody > tr:nth-child(1) > td');

                const brand = titleArray.length > 1 ? titleArray[1] : '';
                const size = getData($, '#pdpMirakl > div:nth-child(3) > div.productInfoTabs > ul.tabContent > li.specificationDetails > table > tbody > tr:nth-child(4) > td');
                const acea = getData($, '#pdpMirakl > div:nth-child(3) > div.productInfoTabs > ul.tabContent > li.specificationDetails > table > tbody > tr:nth-child(5) > td');
                const deliveryInfo = getData($, '#deliveryOptions > tbody > tr:nth-child(1) > td:nth-child(2) > h6');
                const deliveryInfoArray = deliveryInfo.match(/£\d+(?:\.\d+)?/g);
                const deliveryCharge = deliveryInfoArray && deliveryInfoArray.length > 0 ? deliveryInfoArray[0] : '';
                const freeDeliveryThreshold = deliveryInfoArray && deliveryInfoArray.length > 1 ? deliveryInfoArray[1] : '';

                const product = new Product(title, company, brand, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, '');
                writeToFile(getValues(product));
            }

        }
    };

    getData: function getData(page$, selector) {
        return page$(selector) ? page$(selector).text().trim().replace(/\n\t/g, '') : '';
    }
    writeToFile: function writeToFile(rowString) {
        fs.appendFile(fileName, rowString, (error) => {
            if (error) {
                console.log(`Unable to append ${rowString}`);
            } else {
                //console.log(rowString);
            }
        });
    }

    getKeys: function getKeys(domainObject) {
        const rowArray = Object.keys(domainObject);
        return `${rowArray.toString().toUpperCase()}\n`;
    }
    getValues: function getValues(domainObject) {
        const rowArray = Object.keys(domainObject).map(col => domainObject[col]);
        return `${rowArray}\n`;
    }
}
module.exports = webScrapService;