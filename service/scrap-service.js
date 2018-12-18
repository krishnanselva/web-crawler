const {
    from,
    of
} = require('rxjs');
const {
    map,
    distinct,
    filter,
    mergeMap,
    share,
    catchError
} = require('rxjs/operators');
const rp = require('request-promise-native');
const normalizeUrl = require('normalize-url');
const cheerio = require('cheerio');
const {
    resolve
} = require('url');
const fs = require('fs');
const Product = require('../domain/product');
const ProductSpec = require('../domain/product-spec');
const maxConcurrentReq = 5;
const headers = {
    title: 'Listed Product Name',
    company: 'Master Brand',
    brand: 'Product Brand',
    variant: 'Product Variant',
    sellPrice: 'Current Price',
    saving: 'Saving',
    wasPrice: 'Original Price',
    grade: 'Viscosity',
    size: 'Pack Size',
    acea: 'ACEA Specifications',
    freeDeliveryThreshold: 'Free Delivery Threshold',
    deliveryCharge: 'Delivery Charge',
    retailer: 'Retailer',
    country: 'Country',
    url: 'Url',
    sku: 'SKU',
    promotion: 'Promotion',
    extractDate: 'Extract Date',
    extractTime: 'Extract Time',
    extractDateTime: 'Day,Extract Date & Time'
};
const now = new Date();

var scrapService = function (retailer, country, allUrl$, scrapUrl) {
    const fileName = `../Engine-oil-${retailer.replace(/\s/g,'-')}-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-T-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.csv`;
    startScrap(allUrl$, scrapUrl);

    function startScrap(allUrl$, scrapUrl) {
        writeHeader();
        const uniqueUrl$ = allUrl$.pipe(
            // only crawl base url
            //   filter(url => url.includes(baseUrl)),
            // normalize url for comparison
            // map(url => normalizeUrl(url, {
            //     removeTrailingSlash: true,
            //     removeQueryParameters: [],
            //     stripHash: true
            // })),
            // distinct is a RxJS operator that filters out duplicated values
            distinct()
        );

        const urlAndDOM$ = uniqueUrl$.pipe(
            mergeMap(
                url => {
                    //https://www.eurocarparts.com/ecp/p/car-parts/engine-parts/engine-parts1/engine-oils/?521776031&1&cc5_248
                    // console.log(url);
                    return from(rp(url)).pipe(
                        catchError(error => {
                            const {
                                uri
                            } = error.options;
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

    }

    function equalsByAlphanumeric(str1, str2) {
        return swallowAllExceptAlphanumeric(str1) === swallowAllExceptAlphanumeric(str2);
    }

    function swallowAllExceptAlphanumeric(str) {
        return str.replace(/[^a-z0-9]/ig, '');
    }

    this.getData = function getData(page$, selector) {
        //TODO val() doesn't work?
        //return page$(selector) ? page$(selector).val() : ''; 
        return page$(selector) ? page$(selector).text().trim().replace(/\r?\n?\t?/g, '') : '';
    };

    function writeToFile(rowString) {
        fs.appendFile(fileName, `\ufeff${rowString}`, 'utf8', (error) => {
            if (error) {
                console.log(`Unable to append ${rowString}`);
            } else {
                //console.log(rowString);
            }
        });
    }

    function writeHeader() {
        const product = new Product();
        writeToFile(getRowHeader(product));
    }

    this.appendRow = function appendRow(title, company, brand, variant, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, sku, promotion) {
        const product = new Product(title, company, brand, variant, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, retailer, country, url, sku, promotion);
        writeToFile(getRowData(product));
    }

    function getRowHeader(domainObject) {
        const rowArray = Object.keys(domainObject);
        return `${rowArray.map(col => headers[col])}\n`;
    }

    function getRowData(domainObject) {
        const rowArray = Object.keys(domainObject).map(col => domainObject[col]);
        return `${rowArray}\n`;
    }

    this.getFirstNumber = function getFirstNumber(str) {
        const strArray = str.match(/\d+/);
        return strArray.length > 0 ? strArray[0] : '';
    };

    this.encode = function encode(unencodedUrl) {
        return unencodedUrl ? encodeURIComponent(unencodedUrl).replace(/'/g, "%27").replace(/"/g, "%22") : '';
    };
    this.decode = function decode(encodedUrl) {
        return encodedUrl ? decodeURIComponent(encodedUrl.replace(/\+/g, " ")) : '';
    }

};
module.exports = scrapService;