const {
    BehaviorSubject
} = require('rxjs');
const {
    resolve
} = require('url');
const ProductSpec = require('../domain/product-spec');
const ScrapService = require('../service/scrap-service');

var scrapEuroCarParts = function () {
    // https://www.eurocarparts.com/engine-oils?Categories=Engine_Oil
    // https://www.eurocarparts.com/ecp/p/car-parts/engine-parts/engine-parts1/engine-oils
    let baseUrl = 'https://www.eurocarparts.com/engine-oils?Categories=Engine_Oil';
    // baseUrl = 'https://www.eurocarparts.com/ecp/p/car-parts/engine-parts/engine-parts1/engine-oils/?521776062&1';
    // baseUrl = 'https://www.eurocarparts.com/ecp/p/car-parts/engine-parts/engine-parts1/engine-oils/?521771951&1';
    const allUrl$ = new BehaviorSubject(baseUrl);
    const scrapService = new ScrapService('Euro Car Parts', 'UK', allUrl$, scrapUrl);

    function scrapUrl({
        url,
        $
    }) {
        $('a.next.active').each(function () {
            const href = $(this).attr('href');
            if (href) {
                const absoluteUrl = resolve(url, href);
                allUrl$.next(absoluteUrl);
            }
        });
        $('div.product-info > a.heading').each(function () {
            const href = $(this).attr('href');
            if (href) {
                let absoluteUrl = resolve(url, href);
                //https://eurocarparts.com/ecp/p/car-parts/engine-parts/engine-parts1/engine-oils/?1=&521776031=&cc5_248=
                //TODO refactor
                //Remove [ =&cc5_248= ] as this causing to fail page loading
                if (absoluteUrl.indexOf('?') > -1) {
                    const queryString = absoluteUrl.substring(absoluteUrl.indexOf('?') + 1, absoluteUrl.length);
                    let queryStringArray = queryString && queryString.split('&');
                    if (queryStringArray && queryStringArray.length > 2) {
                        queryStringArray = queryStringArray.slice(0, 2);
                        absoluteUrl = absoluteUrl.substring(0, absoluteUrl.indexOf('?') + 1);
                        absoluteUrl = `${absoluteUrl}${queryStringArray[0]}&${queryStringArray[1]}`;
                    }
                }
                allUrl$.next(absoluteUrl);
            }
        });
        const productLocation = 'body > section > section.container.content-section > section.row.product-detail-section > div.product-detail-inner > div.col-xs-12.col-sm-6.col-md-6';
        const titleSelector = `${productLocation} > h1 > span.heading`;
        if ($(titleSelector)) {
            const title = scrapService.getData($, titleSelector);
            if (title) {
                const spec = getProductSpec(title);
                const currency = scrapService.getData($, `${productLocation} > div:nth-child(2) > span > span:nth-child(1)`);
                const currentPrice = scrapService.getData($, `${productLocation} > div:nth-child(2) > span > span:nth-child(2)`);
                const sellPrice = `${currency}${currentPrice}`;
                const wasPrice = scrapService.getData($, `${productLocation} > div:nth-child(2) > span > div > span.original-val > strike`);
                const saving = ''; //TODO saving      

                let grade = scrapService.getData($, '#tablist1-panel2 > div > div:nth-child(2) > span.value');
                grade = grade ? grade : spec.grade ? spec.grade : grade;
                grade = grade ? grade.toUpperCase() : grade;
                if (grade && grade.indexOf('-') === -1) {
                    const indexW = grade.indexOf('W');
                    if (indexW > -1) {
                        grade = `${grade.substring(0, indexW + 1)}-${grade.substring(indexW + 1, grade.length)}`;
                    }

                }
                let size = scrapService.getData($, '#tablist1-panel2 > div > div:nth-child(4) > span.value');
                size = size ? size : spec.size ? spec.size : size;
                const sizeNum = size ? parseInt(size, 10) : 0;
                if (sizeNum > 1) {
                    size = size.replace(/ltr/i, ' Litres');
                } else if (sizeNum > 0) {
                    size = size.replace(/ltr/i, ' Litre');
                }
                let acea = '';
                //#tablist1-panel1 > ul > li:nth-child(5)                
                $('div[itemprop="description"] > ul > li').each((index, element) => {
                    const productDetailSpec = element.firstChild.data;
                    const productDetailSpecArray = productDetailSpec && productDetailSpec.split(/,|;|\s/g);
                    if (productDetailSpecArray && productDetailSpecArray.length > 0) {
                        productDetailSpecArray.forEach((e, i) => {
                            if (e.toUpperCase().indexOf('ACEA') > -1) {
                                acea = !acea && productDetailSpecArray.length > i ? productDetailSpecArray[i + 1] : acea;
                            }
                        })
                    }

                });
                acea = acea ? acea : spec.acea ? spec.acea : acea;
                //TODO delivery 
                const deliveryInfo = scrapService.getData($, `${productLocation} > div:nth-child(2) > div.list-row > span:nth-child(3)`);
                const deliveryInfoArray = deliveryInfo.match(/£\d+(?:\.\d+)?/g);
                const deliveryCharge = deliveryInfoArray && deliveryInfoArray.length > 0 ? deliveryInfoArray[0] : '';
                const freeDeliveryThreshold = deliveryInfoArray && deliveryInfoArray.length > 1 ? deliveryInfoArray[1] : '';

                let sku = scrapService.getData($, `${productLocation} > h1 > span.pro-detail`);
                sku = sku.replace('Product Code: ', '')

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
        const sizeReg = /(\d+\s?ltr)/ig;
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
module.exports = scrapEuroCarParts;