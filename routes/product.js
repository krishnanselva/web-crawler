var product = function (title,company, brand, sellPrice, saving, wasPrice, grade, size, acea, freeDeliveryThreshold, deliveryCharge, url, promotion) {
    this.title = title;
    this.company = company;
    this.brand = brand;
    this.sellPrice = sellPrice;
    this.saving = saving;
    this.wasPrice = wasPrice;
    this.grade = grade;
    this.size = size;
    this.acea = acea;
    this.freeDeliveryThreshold = freeDeliveryThreshold;
    this.deliveryCharge = deliveryCharge;
    this.url = url;
    this.promotion = promotion;
}
module.exports = product;
