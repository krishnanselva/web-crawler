const scrapHalfords = require('./scrap-halfords');
const scrapOpieOils = require('./scrap-opieoils');
const scrapEuroCarParts = require('./scrap-euro-car-parts');
const scrapTesco = require('./scrap-tesco');
const scrapAmazon = require('./scrap-amazon');
module.exports = function scrapRetailers() {
   new scrapHalfords();
   // new scrapOpieOils();
   new scrapEuroCarParts();
   new scrapTesco();
   new scrapAmazon();
};