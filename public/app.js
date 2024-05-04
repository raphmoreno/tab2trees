import { motherlode, populateShop, updateCoinDisplay, getCoins } from './shop.js';
import { getLocation } from './weather.js';
import { updateForestDisplay, resetForest, initializeForest, addTile } from './grid.js';
import { updateDebugVisibility, updateTreeCounterDisplay, toggleVisibility, saveForest, loadForest, displayTileCount, safeAddEventListener } from './utils.js';
import { config } from './config.js';
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "newTab") {
        // Handle the new tab action
        console.log("New tab detected");
        sendResponse({ status: "Received" });
        newTabHandler();
        incrementTileCount();
    }
    return true; // Important for asynchronous sendResponse
});
document.addEventListener('DOMContentLoaded', initializeApp);
const tileTypes = ['forest-1', 'forest-2', 'forest-autumn'];
let forestInitialized = false; // Flag to check if the forest has been initialized
const coinCount = getCoins();
function initializeApp() {
    buildListeners();
    getLocation();
    displayTileCount();
    initializeForest(forestInitialized);
    updateDebugVisibility(config.isDebugMode);
    updateTreeCounterDisplay();
    updateCoinDisplay(coinCount);
}
;
function buildTileSet() {
    const tileSet = [];
    return tileSet;
}
// Build click listeners
function buildListeners() {
    console.log("all good");
    safeAddEventListener('resetButton', 'click', resetForest);
    safeAddEventListener('shopButton', 'click', () => {
        toggleVisibility('shopOverlay', true);
        populateShop();
    });
    safeAddEventListener('overlay-cross', 'click', () => toggleVisibility('shopOverlay', false));
    safeAddEventListener('motherlodeButton', 'click', motherlode);
    chrome.tabs.onCreated.addListener(function () {
        displayTileCount;
    });
}
// Initialize or load the counters
function incrementTileCount() {
    fetch('http://tab.sora-mno.link/api/add-tree', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 1 }) // Increment by one each time a new tab is opened
    })
        .then(response => response.json())
        .then(data => {
        displayTileCount(data.globalTileCount);
    })
        .catch(error => {
        console.error('Error updating tile count:', error);
        displayTileCount('Error retrieving data');
    });
}
// Function triggered upon new tab creation
function newTabHandler() {
    chrome.storage.local.get({ lifetimeTreeCount: 0 }, function (data) {
        let tiles = loadForest();
        let newGridCount = tiles.length + 1; // Increment tile count
        let newLifetimeCount = data.lifetimeTreeCount + 1;
        let newCoins = getCoins();
        // If newGridCount exceeds the total number of tiles the grid can hold
        if (newGridCount > config.gridWidth * config.gridHeight) {
            newGridCount = 1; // Start again with one new tile
            tiles = []; // Reset the array holding the tiles
            // Assume adding a tile for the new grid cycle
            tiles = addTile(tiles);
            newCoins += 1; // Increment coins as a reward for filling the grid
        }
        else {
            // Otherwise, continue adding tiles normally
            tiles = addTile(tiles);
        }
        // Update persistent storage and UI
        chrome.storage.local.set({ lifetimeTreeCount: newLifetimeCount, coins: newCoins }, function () {
            saveForest(tiles); // Save the updated state
            updateForestDisplay(tiles.length); // Redraw the forest
            updateTreeCounterDisplay(newLifetimeCount); // Update display counters
            updateCoinDisplay(newCoins);
        });
    });
}
//# sourceMappingURL=app.js.map