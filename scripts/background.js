const MAX_CURRENCIES = 15;
const MIN_CURRENCIES = 2;
var cache = { USD: 1, KYD: 0.83 };
var gloabal_timer = null;
var timeout = false;

refreshRate();
setInterval(refreshRate, 15 * 60 * 1000);

function round(value, decimal) {
    return Number.parseFloat(value).toFixed(10);
}

function refreshRate() {
    var timer = null;
    var xhrFiat = new XMLHttpRequest();
    var xhrCrypto = new XMLHttpRequest();

    // Fiat currencies
    xhrFiat.open("GET", "https://open.er-api.com/v6/latest/USD", true);
    xhrFiat.onload = function () {
        timeout = false;
        clearTimeout(timer);
        var response = JSON.parse(xhrFiat.responseText);

        for (const code in response.rates) {
            cache[code] = response.rates[code];
        }
    };
    xhrFiat.send(null);

    // Crypto currencies
    xhrCrypto.open("GET", "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1", true);
    xhrCrypto.onload = function () {
        timeout = false;
        clearTimeout(timer);
        if (xhrCrypto.readyState === 4) {
            if (xhrCrypto.status === 200) {
                var response2 = JSON.parse(xhrCrypto.responseText);

                for (var key in response2) {
                    cache[response2[key]['symbol'].toUpperCase()] = 1 / response2[key]['current_price'];
                }
            } else {
                console.error(xhrCrypto.statusText);
            }
        }
    };
    xhrCrypto.send(null);

    timer = setTimeout(function () {
        xhrFiat.abort();
        xhrCrypto.abort();
        timeout = true;
    }, 10000);
}

function get_price_in_usd(to) {
    var toRate = cache[to];
    var toUsd = 1 / toRate;
    return toUsd;
}

function convertValue(value, from, to, callback) {
    if (timeout) refreshRate();

    gloabal_timer = setTimeout(function () {
        callback({ status: "error" });
    }, 10000);
    convertValueRecursive(value, from, to, callback);
}

function convertValueRecursive(value, from, to, callback) {
    var fromRate = cache[from];
    var toRate = cache[to];
    var toUsd = 1 / toRate

    if (fromRate == undefined || toRate == undefined) {
        setTimeout(function () {
            convertValueRecursive(value, from, to, callback);
        }, 500);
        return;
    }

    clearTimeout(gloabal_timer);
    var converted = round((value / fromRate) * toRate, 6);
    callback({ status: "success", value: converted, toUsd: toUsd });
}


var currencies = [];

for (var i = 0; i < MAX_CURRENCIES; i++) {
    var currency = localStorage.getItem("currency" + i);

    if (currency == undefined) {
        if (i == 0) currency = "EUR";
        else if (i == 1) currency = "USD";
        else break;
    }

    currencies[i] = currency;
}

localStorage.setItem("currencies", JSON.stringify(currencies));

