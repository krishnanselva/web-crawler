const scrapHalfords = require('./scrap-halfords');
const scrapEuroCarParts = require('./scrap-euro-car-parts');
const scrapTesco = require('./scrap-tesco');
module.exports = function scrapRetailers() {
   new scrapHalfords();
   new scrapEuroCarParts();
   new scrapTesco();
}