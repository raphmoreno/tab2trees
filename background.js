const newlyCreatedTabs = new Set();

// Listen for new tab creation
chrome.tabs.onCreated.addListener(function(tab) {
    // Mark this tab as newly created
    newlyCreatedTabs.add(tab.id);
});

// Listen for any updates to tabs
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Check if the tab is fully loaded and if it's marked as newly created
    if (changeInfo.status === 'complete' && newlyCreatedTabs.has(tabId)) {
        // Send a message to the content script in this tab
        chrome.tabs.sendMessage(tabId, { action: "newTab" });

        // Remove the tab from the tracking set as it's no longer 'new'
        newlyCreatedTabs.delete(tabId);
    }
});
