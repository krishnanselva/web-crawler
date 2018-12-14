const scrapHalfords = require('./scrap-halfords');
const scrapEuroCarParts = require('./scrap-euro-car-parts');
module.exports = function scrapRetailers() {
   new scrapHalfords();
//    new scrapEuroCarParts();
}