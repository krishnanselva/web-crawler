const {
    BehaviorSubject
} = require('rxjs');
const {
    resolve
} = require('url');
const getSymbolFromCurrency = require('currency-symbol-map');
const ProductSpec = require('../domain/product-spec');
const ScrapService = require('../service/scrap-service');

var scrapAmazon = function () {

    let baseUrl = 'https://www.amazon.co.uk/s/s/ref=sr_nr_p_76_0?fst=as:off&rh=n:248877031,n:301315031,n:2494718031,n:303979031,k:engine oil,p_76:419158031&keywords=engine oil&ie=UTF8&qid=1545064211&rnid=419157031';
    // baseUrl = 'https://www.amazon.co.uk/Comma-CLA20505L-20W-Classic-Motor/dp/B002RPJ67E/ref=sr_1_1?s=automotive&ie=UTF8&qid=1545141807&sr=1-1&keywords=B002RPJ67E';
    const allUrl$ = new BehaviorSubject(baseUrl);
    const scrapService = new ScrapService('Amazon', 'UK', allUrl$, scrapUrl);

    function scrapUrl({
        url,
        $
    }) {
        $('a.s-access-detail-page,#pagnNextLink').each(function () {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });
        let soldBy = scrapService.getData($, `#merchant-info`);
        let delivery = scrapService.getData($, `#price-shipping-message > b:first-child`);
        let title = scrapService.getData($, `#productTitle`);
        if (delivery.search(/(FREE)/ig) > -1 && soldBy.search(/(sold\sby\sAmazon)/ig) > -1 && title) {
            title = title.replace(/,\s?/g, ' ');
            const spec = getProductSpec(title);
            let sellPrice = scrapService.getData($, `#price_inside_buybox`);
            if (!sellPrice && $('cerberus-data-metrics').length > 0) {
                const sellPriceISOCurrency = $('cerberus-data-metrics').attr('data-asin-currency-code');
                const sellPriceValue = $('cerberus-data-metrics').attr('data-asin-price');
                const sellPriceSymbolCurrency = getSymbolFromCurrency(sellPriceISOCurrency);
                sellPrice = sellPriceSymbolCurrency && sellPriceValue ? `${sellPriceSymbolCurrency}${sellPriceValue}` : ``;
            }
            const wasPrice = scrapService.getData($, `#price > table > tbody > tr:nth-child(1) > td.a-span12.a-color-secondary.a-size-base > span.a-text-strike`);
            let saving = scrapService.getData($, `#regularprice_savings > td.a-span12.a-color-price.a-size-base`);
            saving = saving ? saving.replace(/(\s?\(.*\))/g, '') : saving;
            const prodDescSelector = '#aplus > div > div.celwidget.aplus-module.module-1 > div > div.a-expander-content.a-expander-partial-collapse-content > div.aplus-module-wrapper.apm-fixed-width > div > div > div.apm-centerthirdcol.apm-wrap > p';
            let prodDesc = getProductSpec(scrapService.getData($, `${prodDescSelector}:last-child`));
            if (!prodDesc.acea && $('#productDescription > p').length > 0) {
                prodDesc = getProductSpec(scrapService.getData($, `#productDescription > p:last-child`));
            }
            let grade = spec.grade ? spec.grade : prodDesc.grade ? prodDesc.grade : '';
            grade = grade ? grade.toUpperCase().replace('/', '-') : grade;
            if (grade && grade.indexOf('-') === -1) {
                const indexW = grade.indexOf('W');
                if (indexW > -1) {
                    grade = `${grade.substring(0, indexW + 1)}-${grade.substring(indexW + 1, grade.length)}`;
                }
            }
            let size = prodDesc.size ? prodDesc.size : spec.size ? spec.size : '';
            const sizeNum = size ? parseInt(size, 10) : 0;
            if (sizeNum > 1) {
                size = size.replace(/L(itre)?/i, ' Litres');
            } else if (sizeNum > 0) {
                size = size.replace(/L(itre)?/i, ' Litre');
            }
            let acea = prodDesc.acea ? prodDesc.acea : spec.acea ? spec.acea : '';
            //TODO delivery    
            const deliveryCharge = '';
            const freeDeliveryThreshold = '';
            const sku = scrapService.getData($, `#prodDetails > div.wrapper.GBlocale > div.column.col2 > div:nth-child(1) > div.content.pdClearfix > div > div > table > tbody > tr:nth-child(1) > td.value`);
            const promotion = '';
            if (sellPrice && grade) {
                scrapService.appendRow(title, spec.company, spec.brand, spec.variant, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, sku, promotion);
            }
        }

    }


    function getProductSpec(title) {
        const spec = new ProductSpec();
        if (title && title.trim().length > 0) {

            //remove grade
            const gradeReg = /(\d+W\s?\/?-?\d+)/ig;
            const grade = title.match(gradeReg);
            let titleTemp = title;
            if (grade && grade.length > 0) {
                spec.grade = grade[0];
                titleTemp = titleTemp.replace(gradeReg, '');
            }

            //remove size
            const sizeReg = /(\d+\s?L)/ig;
            const size = titleTemp.match(sizeReg);
            if (size && size.length > 0) {
                spec.size = size[0];
                titleTemp = titleTemp.replace(sizeReg, '');
            }

            //remove oil
            titleTemp = titleTemp.replace(/(Engine)|(Oil)|-/ig, '').trim();

            let titleArray = titleTemp.split(/,|\s/);

            spec.company = titleArray[0];
            if (titleArray.length > 1) {
                spec.brand = titleArray[1];
            }

            if (titleArray.length > 2) {
                spec.variant = titleArray.slice(2).filter(s => s.trim().length > 0).join(' ');
                const isAcea = /(ACEA\s([A-Za-z]\d.?)+)/g;
                const aceaArray = title.match(isAcea);
                spec.acea = aceaArray && aceaArray.length > 0 ? aceaArray[0] : '';
                spec.acea = spec.acea.replace(/(ACEA\s?)|\(|\)|,|;|\./g, '');
            }
        }
        return spec;
    }

};
module.exports = scrapAmazon;