const {
    BehaviorSubject
} = require('rxjs');
const {
    resolve
} = require('url');
const ProductSpec = require('../domain/product-spec');
const ScrapService = require('../service/scrap-service');

var scrapOpieOils = function () {      
    let baseUrl = 'https://www.opieoils.co.uk/c-647-engine-oil-by-grade-viscosity.aspx';
    //baseUrl = 'https://www.opieoils.co.uk/p-114450-motul-300v-sprint-0w-15-competition-qualifying-engine-oil.aspx';
    const allUrl$ = new BehaviorSubject(baseUrl);
    const scrapService = new ScrapService('Opie Oils', 'UK', allUrl$, scrapUrl);

    function scrapUrl({
        url,
        $
    }) {
        $('a.category-name,h2.productResultName > a').each(function () {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });

        const productLocation = 'body > section > section.container.content-section > section.row.product-detail-section > div.product-detail-inner > div.col-xs-12.col-sm-6.col-md-6';
        const titleSelector = `#productName`;
        if ($(titleSelector)) {
            const title = scrapService.getData($, titleSelector);
            if (title) {
                const spec = getProductSpec(title);                                
                const sellPrice = scrapService.getData($, `#productPrice > h2 > span.currency`);
                const wasPrice = scrapService.getData($, `.msrp.currency`);
                const saving = ''; //TODO saving      

                let grade = scrapService.getData($, 'div.overview > table > tbody > tr:nth-child(2) td> td');
                grade = grade ? grade : spec.grade ? spec.grade : grade;
                grade = grade ? grade.toUpperCase() : grade;
                if (grade && grade.indexOf('-') === -1) {
                    const indexW = grade.indexOf('W');
                    if (indexW > -1) {
                        grade = `${grade.substring(0, indexW + 1)}-${grade.substring(indexW + 1, grade.length)}`;
                    }

                }
                let size = scrapService.getData($, '#var-selected > span.var_name');
                size = size ? size : spec.size ? spec.size : size;
   
                let acea = '';
                acea = acea ? acea : spec.acea ? spec.acea : acea;                

                const deliveryInfo = scrapService.getData($, `#summary > div:nth-child(1) > p.detail.shipping`);
                const deliveryInfoArray = deliveryInfo.match(/£\d+(?:\.\d+)?/g);                
                const deliveryCharge = deliveryInfoArray && deliveryInfoArray.length > 0 ? deliveryInfoArray[0] : '';
                const freeDeliveryThresholdInfo = scrapService.getData($,'#tabbing_desc_bx > div > div.cont > div.tab_ship.c.active > p:nth-child(4) > b');
                const freeDeliveryThresholdInfoArray = freeDeliveryThresholdInfo.match(/FREE for orders of £\d+(?:\.\d+)?/i);    
                const freeDeliveryThreshold = freeDeliveryThresholdInfoArray && freeDeliveryThresholdInfoArray.length > 1 ? freeDeliveryThresholdInfoArray[1] : '';

                let sku = $('#ProductID').val();

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
        const sizeReg = /(\d+\s?Litres?)/ig;
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
            spec.acea = spec.acea.replace(/\(|\)/g, '');
        }

        return spec;
    }
};
module.exports = scrapOpieOils;