const scrapHalfords = require('./routes/scrap-halfords');
module.exports =  function scrapRetailers() {
    new scrapHalfords();
}