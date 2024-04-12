// Listen for tab creation
chrome.tabs.onCreated.addListener(function() {
    // Send a message to the active tab to increment the tree counter
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Check if there's an active tab to avoid errors
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "incrementTreeCounter"});
        }
    });
});
