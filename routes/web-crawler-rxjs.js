const { BehaviorSubject, from, of } = require('rxjs');
const { map, distinct, filter, mergeMap, share, catchError } = require('rxjs/operators');
const rp = require('request-promise-native');
const normalizeUrl = require('normalize-url');
const cheerio = require('cheerio');
const { resolve } = require('url');
const fs = require('fs');

var webCrawler = function (baseUrl,siteMapFile) {
    const maxConcurrentReq = 5;
    const allUrl$ = new BehaviorSubject(baseUrl);
    this.startCrawl = () => {
        const uniqueUrl$ = allUrl$.pipe(
            // only crawl base url
            filter(url => url.includes(baseUrl)),
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
        $('a').each(function (i, elem) {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = addToSiteMap(url, href);;
                allUrl$.next(absoluteUrl);
            }
        });
        $('img').each(function (i, elem) {
            const src = $(this).attr('src');
            if (src) {
                addToSiteMap(url, src);
            }

        });
    };

    addToSiteMap: function addToSiteMap(baseUrl, url) {
        // build the absolute url
        const absoluteUrl = resolve(baseUrl, url);
        fs.appendFile(siteMapFile, `${absoluteUrl}\n`, (error) => {
            if (error) {
                console.log(`Unable to append ${absoluteUrl}`);
            }
        });
        return absoluteUrl;
    }

    this.scrapUrl = scrapUrl;
    this.addToSiteMap = addToSiteMap;
}

module.exports = webCrawler;