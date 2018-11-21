// tests/part1/cart-summary-test.js
var chai = require('chai');
var chaiRx = require('chai-rx');
var expect = chai.expect; // we are using the "expect" style of Chai
var webCrawler = require('../routes/web-crawler-rxjs');
var baseUrl = 'https://abcd.com';
var siteMapfile = 'test/sitemap_test.txt';
describe('Unittest webCrawler', function () {
  let webCrawlerTest = new webCrawler(baseUrl, siteMapfile);
  it(`convert absolute url if it is relative`, function () {
    expect(webCrawlerTest.addToSiteMap(baseUrl, '/test')).to.be.equals('https://abcd.com/test');
  });
  it(`skip changing the url if it is from different domain`, function () {
    expect(webCrawlerTest.addToSiteMap(baseUrl, 'http://abc.com/test')).to.be.equals('http://abc.com/test');
  });
});