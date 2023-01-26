// Function to convert the prices
function convertPrices() {
    var pattern = /^\$(\d{1,3},?)+(\.\d{1,2})?$/;
    var elements = document.querySelectorAll("*");
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if(pattern.test(element.textContent)){
            var originalText = element.textContent;
            var price = parseFloat(element.textContent.replace('$','').replace(',',''));
            var bitcoinPrice = price / exchangeRate;
            var satoshisPrice = bitcoinPrice * 100000000;
            element.textContent = bitcoinPrice.toFixed(8) + " BTC";
            element.setAttribute("data-original", originalText);
            element.setAttribute("data-bitcoin", bitcoinPrice.toFixed(8) + " BTC");
            element.setAttribute("data-satoshis", satoshisPrice.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " Sats");
            element.setAttribute("data-toggle", "BTC");
            element.addEventListener("mouseover", function(event) {
                event.target.textContent = event.target.getAttribute("data-original");
            });
            element.addEventListener("mouseout", function(event) {
                var currentToggle = event.target.getAttribute("data-toggle");
                if(currentToggle == "BTC") {
                    event.target.textContent = event.target.getAttribute("data-satoshis");
                    event.target.setAttribute("data-toggle", "SATS");
                } else {
                    event.target.textContent = event.target.getAttribute("data-bitcoin");
                    event.target.setAttribute("data-toggle", "BTC");
                }
            });
        }
    }
    
    
}

// API endpoint for current Bitcoin price
var endpoint = 'https://api.coindesk.com/v1/bpi/currentprice.json';

// Check for stored exchange rate in chrome.storage.local
chrome.storage.local.get(['exchangeRate', 'exchangeRateTimestamp'], function(result) {
    var currentTimestamp = Date.now();
    if (result.exchangeRate && currentTimestamp - result.exchangeRateTimestamp < 3600*1000) {
        // Use stored exchange rate
        exchangeRate = result.exchangeRate;
        convertPrices();
    } else {
        // Fetch exchange rate from API
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                if (data && data.bpi && data.bpi.USD) {
                    // Store exchange rate and timestamp in chrome.storage.local
                    chrome.storage.local.set({'exchangeRate': data.bpi.USD.rate_float, 'exchangeRateTimestamp': currentTimestamp});
                    exchangeRate = data.bpi.USD.rate_float;
                    convertPrices();
                } else {
                    console.error("Error: Exchange rate data not found in API response");
                }
            })
            .catch(error => console.error(error));
    }
});

// Schedule to update the exchange rate every hour
setInterval(function() {
    chrome.storage.local.get(['exchangeRate', 'exchangeRateTimestamp'], function(result) {
        var currentTimestamp = Date.now();
        if (currentTimestamp - result.exchangeRateTimestamp >= 3600*1000) {
            // Fetch exchange rate from API
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    if (data && data.bpi && data.bpi.USD) {
                        // Store exchange rate and timestamp in chrome.storage.local
                        chrome.storage.local.set({'exchangeRate': data.bpi.USD.rate_float, 'exchangeRateTimestamp': currentTimestamp});
                        exchangeRate = data.bpi.USD.rate_float;
                        convertPrices();
                    } else {
                        console.error("Error: Exchange rate data not found in API response");
                    }
                })
                .catch(error => console.error(error));
        }
    });
}, 3600*1000);

