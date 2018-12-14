const {
    BehaviorSubject} = require('rxjs');
const {
    resolve
} = require('url');
const ProductSpec = require('./product-spec');
const ScrapService = require('./scrap-service');

var scrapHalfords = function () {

    const baseUrl = 'https://www.halfords.com/motoring/engine-oils-fluids/engine-oil';
    const allUrl$ = new BehaviorSubject(baseUrl);
    const scrapService = new ScrapService('Halfords', 'UK', allUrl$, scrapUrl);

    function scrapUrl({
        url,
        $
    }) {

        $('a.productModuleTitleLink,a.pageLink').each(function () {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });
        if ($('#topSection > div.rightCol > h1')) {
            const title = scrapService.getData($, '#topSection > div.rightCol > h1');
            if (title) {
                const spec = getProductSpec(title);
                const sellPrice = scrapService.getData($, '#stickyAddToBasketPrice');
                const saving = scrapService.getData($, '.savingValue');
                const wasPrice = scrapService.getData($, '.wasValue');
                const specDataSelector = '#pdpMirakl > div:nth-child(3) > div.productInfoTabs > ul.tabContent > li.specificationDetails > table > tbody > tr';
                let grade = getSpecData($, specDataSelector, 'Grade:');
                let size = getSpecData($, specDataSelector, 'Size:');
                const acea = getSpecData($, specDataSelector, 'ACEA:');
                grade = grade ? grade : spec.grade ? spec.grade : grade;
                size = size ? size : spec.size ? spec.size : size;
                const deliveryInfo = scrapService.getData($, '#deliveryOptions > tbody > tr:nth-child(1) > td:nth-child(2) > h6');
                const deliveryInfoArray = deliveryInfo.match(/£\d+(?:\.\d+)?/g);
                const deliveryCharge = deliveryInfoArray && deliveryInfoArray.length > 0 ? deliveryInfoArray[0] : '';
                const freeDeliveryThreshold = deliveryInfoArray && deliveryInfoArray.length > 1 ? deliveryInfoArray[1] : '';
                const sku = scrapService.getData($, '#PDPProductId');
                const promotion = '';
                scrapService.appendRow(title, spec.company, spec.brand, spec.variant, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, sku, promotion);
            }

        }
    }

    function getProductSpec(title) {
        const spec = new ProductSpec();
        //remove grade
        const gradeReg = /(\d+W\s?\/?-?\d+)/ig;
        const grade = title.match(gradeReg);
        let titleTemp = title;
        if (grade && grade.length > 0) {
            spec.grade = grade[0];
            titleTemp = titleTemp.replace(gradeReg, '');
        }

        //remove size
        const sizeReg = /(\d+\s?L(itres?)?)/ig;
        const size = titleTemp.match(sizeReg);
        if (size && size.length > 0) {
            spec.size = size[0];
            titleTemp = titleTemp.replace(sizeReg, '');
        }

        //remove oil
        titleTemp = titleTemp.replace(/(Oil)/ig, '').trim();
        let titleArray = titleTemp.split(' ');

        spec.company = titleArray[0];
        if (titleArray.length > 1) {
            spec.brand = titleArray[1];
        }
        if (titleArray.length > 2) {
            spec.variant = titleArray.slice(2).join(' ');
        }
        return spec;
    }

    function getSpecData(page$, specSelector, specLabelRequired) {
        let specData = '';
        page$(specSelector).each((index, element) => {
            if (element.children.length > 3) {
                const specLabel = element.children[1].firstChild.data;
                if (specLabel === specLabelRequired) {
                    const specValue = element.children[3].firstChild.data;
                    if (specValue) {
                        specData = specValue.trim().replace(/\r?\n?\t?/g, '');
                    }

                }
            }
        });
        return specData;
    }
};
module.exports = scrapHalfords;