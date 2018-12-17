const {
    BehaviorSubject
} = require('rxjs');
const {
    resolve
} = require('url');
const ProductSpec = require('../domain/product-spec');
const ScrapService = require('../service/scrap-service');

var scrapTesco = function () {

    let baseUrl = 'https://www.tesco.com/groceries/en-GB/search?query=engine%20oil';
    // baseUrl = 'https://www.tesco.com/groceries/en-GB/products/285281541';
    const allUrl$ = new BehaviorSubject(baseUrl);
    const scrapService = new ScrapService('Tesco', 'UK', allUrl$, scrapUrl);

    function scrapUrl({
        url,
        $
    }) {

        $('a.product-tile--title.product-tile--browsable,#product-list > div.product-list-view.has-trolley > div.pagination-component.grid > nav > ul > li:last-child').each(function () {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });
        const titleSelector = `div.product-details-tile__title-wrapper > h1`;
        if ($(titleSelector)) {
            const title = scrapService.getData($, titleSelector);
            if (title) {
                const spec = getProductSpec(title);
                const currency = scrapService.getData($, `div.price-control-wrapper > div > div > span > span.currency`);
                const currentPrice = scrapService.getData($, `div.price-control-wrapper > div > div > span > span.value`);
                const sellPrice = `${currency}${currentPrice}`;
                const wasPrice = '';
                const saving = '';
                let prodDesc = getProductSpec(scrapService.getData($, `#product-description > ul > li:first-child`));
                const prodDescLength = $('#product-marketing > ul > li').length;
                for (let i = 1; i <= prodDescLength && !prodDesc.grade; i++) {
                    prodDesc = getProductSpec(scrapService.getData($, `#product-marketing > ul > li:nth-child(${i})`));
                }
                let grade = prodDesc.grade ? prodDesc.grade : spec.grade ? spec.grade : '';
                grade = grade ? grade.toUpperCase() : grade;
                if (grade && grade.indexOf('-') === -1) {
                    const indexW = grade.indexOf('W');
                    if (indexW > -1) {
                        grade = `${grade.substring(0, indexW + 1)}-${grade.substring(indexW + 1, grade.length)}`;
                    }

                }
                let size = prodDesc.size ? prodDesc.size : spec.size ? spec.size : '';
                const sizeNum = size ? parseInt(size, 10) : 0;
                if (sizeNum > 1) {
                    size = size.replace(/L/i, ' Litres');
                } else if (sizeNum > 0) {
                    size = size.replace(/L/i, ' Litre');
                }
                let acea = prodDesc.acea ? prodDesc.acea : spec.acea ? spec.acea : '';
                //TODO delivery    
                const deliveryCharge = '';
                const freeDeliveryThreshold = '';
                const sku = scrapService.getFirstNumber(url);
                const promotion = '';
                if (grade) {
                    scrapService.appendRow(title, spec.company, spec.brand, spec.variant, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, sku, promotion);
                }
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
        const sizeReg = /(\d+\s?L)/ig;
        const size = titleTemp.match(sizeReg);
        if (size && size.length > 0) {
            spec.size = size[0];
            titleTemp = titleTemp.replace(sizeReg, '');
        }

        //remove oil
        titleTemp = titleTemp.replace(/(Engine)|(Oil)|-/ig, '').trim();

        let titleArray = titleTemp.split(' ');

        spec.company = titleArray[0];
        if (titleArray.length > 1) {
            spec.brand = titleArray[1];
        }

        if (titleArray.length > 2) {
            spec.variant = titleArray.slice(2).join(' ');
            const isAcea = /([A-Za-z]\d\/?)/g;
            spec.acea = titleArray.slice(2).filter(s => isAcea.test(s)).join('');
            spec.acea = spec.acea.replace(/\(|\)|,/g, '');
        }

        return spec;
    }

};
module.exports = scrapTesco;