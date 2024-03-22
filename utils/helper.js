const shuffle = require("string-shuffle")
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

exports.shuffledString = (email) => {
    const time = new Date().getTime();
    const string = time + email.substring(0, 8).replace('@', '$').replace('.', '$').toUpperCase()
    return shuffle.shuffleString(string)
}

exports.storeDataInCache = (key, value) => {
    myCache.set(key, value, 24 * 60 * 60)
}

exports.getDataFromCache = (key) => {
    return myCache.get(key);
}