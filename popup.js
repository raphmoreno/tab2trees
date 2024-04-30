document.addEventListener('DOMContentLoaded', function() {
    fetchCounts();
    document.getElementById('shop-button').addEventListener('click', function() {
        chrome.tabs.create({ url: "http://yourshopurl.com" });  // Replace with your actual shop URL
    });
});

function fetchCounts() {
    // Example: Fetching data stored in chrome.storage
    chrome.storage.local.get(['globalTreeCount', 'personalTreeCount', 'coins'], function(result) {
        document.querySelector('#global-tree-count span').textContent = result.globalTreeCount || '0';
        document.querySelector('#personal-tree-count span').textContent = result.personalTreeCount || '0';
        document.querySelector('#coin-count span').textContent = result.coins || '0';
    });
}
