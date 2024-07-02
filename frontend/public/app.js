import { updateDebugVisibility, updateTreeCounterDisplay, clearStorageData, toggleVisibility, displayTabCount, safeAddEventListener, initializeUserID, loadAssets, loadBackground, calculateCoinIncrement } from './utils.js';
import { getLocation } from './weather.js';
import { populateShop, updateCoinDisplay, getCoins, getPurchasedItems } from './shop.js';
import { config } from './config.js';
import { renderAssetOnPosition, createIsometricGrid, spawnAsset, spawnRandomTree } from './grid.js';
let forestInitialized = false; // Flag to check if the forest has been initialized
const placementStrategy = "random";
const defaultEnvironment = {
    type: "forest",
    size: { width: 750, height: 500 },
    svgPath: "../src/assets/svg/basetiles/forest/large-forest.svg"
};
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeApp().then(() => {
        }).catch(error => {
            console.error("Error during app initialization:", error);
        });
    }, 50);
});
async function initializeApp() {
    try {
        const availableAssets = await getPurchasedItems();
        const assets = await loadAssets(availableAssets);
        const canvas = document.getElementById('canvas');
        let svgElement = await loadBackground(canvas, defaultEnvironment);
        if (!svgElement) {
            throw new Error("SVG element could not be loaded.");
        }
        const appState = await initializeAppState();
        buildListeners(appState.grid, assets);
        updateDebugVisibility(config.isDebugMode);
        const coinCount = await getCoins();
        initializeUserID();
        displayTabCount();
        updateTreeCounterDisplay();
        updateCoinDisplay(coinCount);
        getLocation();
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.action === "newTab") {
                // Handle the new tab action
                sendResponse({ status: "Received" });
                newTabHandler(assets);
                incrementTabCount(1);
            }
            return true; // Important for asynchronous sendResponse
        });
        forestInitialized = true;
    }
    catch (error) {
        console.error("Failed to initialize the application:", error);
    }
}
function buildListeners(grid, assets) {
    var _a;
    const SVGCanvas = document.getElementById('svgBackground');
    const appSwitcherButton = document.getElementById('appSwitcherButton');
    const appSwitcherMenu = document.getElementById('appSwitcherMenu');
    //safeAddEventListener('resetButton', 'click', clearStorageData);
    safeAddEventListener('shopButton', 'click', () => {
        toggleVisibility('shopOverlay', true);
        populateShop();
    });
    safeAddEventListener('overlay-cross', 'click', () => toggleVisibility('shopOverlay', false));
    //safeAddEventListener('motherlodeButton', 'click', motherlode);
    window.clearStorageData = clearStorageData;
    chrome.tabs.onCreated.addListener(function () {
        displayTabCount;
    });
    // Listener for spawning random tree
    if (SVGCanvas && appSwitcherButton && appSwitcherMenu) {
        (_a = document.getElementById('test-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            spawnRandomTree(assets, grid, SVGCanvas, placementStrategy).catch(console.error);
        });
        // Listener for the app switcher
        appSwitcherButton.addEventListener('click', function () {
            // Toggle the display of the app switcher menu
            if (appSwitcherMenu.style.display === 'none') {
                appSwitcherMenu.style.display = 'block';
            }
            else {
                appSwitcherMenu.style.display = 'none';
            }
        });
    }
}
// Function to switch environments
function incrementTabCount(count) {
    const userId = chrome.storage.local.get('userId');
    fetch('http://tab.sora-mno.link/api/add-tab', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, count }) // Increment by one each time a new tab is opened
    })
        .then(response => response.json())
        .then(data => {
        displayTabCount(data.globalTileCount);
    })
        .catch(error => {
        console.error('Error updating tile count:', error);
        displayTabCount('Error retrieving data');
    });
}
async function newTabHandler(assets) {
    try {
        const { grid, trees } = await loadAppState();
        const newAsset = assets[Math.floor(Math.random() * assets.length)];
        const SVGCanvas = document.getElementById('svgBackground');
        const assetPlacement = spawnAsset(newAsset, grid, placementStrategy, SVGCanvas);
        if (assetPlacement != null) {
            trees.push(assetPlacement);
            let newLifetimeCount = trees.length;
            let newCoins = await getCoins() + calculateCoinIncrement(trees.length);
            // Save the updated state
            chrome.storage.local.set({
                forestState: JSON.stringify(trees), // Save updated trees
                gridState: JSON.stringify(grid), // Save updated grid
                lifetimeTreeCount: newLifetimeCount,
                coins: newCoins
            }, () => {
                updateTreeCounterDisplay(newLifetimeCount);
                updateCoinDisplay(newCoins);
            });
        }
        else {
            // implement reseting of forest, and adding a new coin
            console.log("no more positions");
        }
    }
    catch (error) {
        console.error("Error handling new tab:", error);
    }
}
async function loadAppState() {
    // Load the combined state from local storage
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['gridState', 'forestState'], function (result) {
            if (result.gridState && result.forestState) {
                const grid = JSON.parse(result.gridState);
                const trees = JSON.parse(result.forestState);
                resolve({ grid, trees });
            }
            else {
                // If no data is found, initialize defaults
                const grid = createIsometricGrid(config.canvasWidth, config.canvasHeight, config.cellWidth, config.cellHeight);
                const trees = [];
                resolve({ grid, trees });
            }
        });
    });
}
async function initializeAppState() {
    // Return the promise chain to ensure that the function returns a Promise<AppState>
    try {
        const { grid, trees } = await loadAppState();
        const canvas = document.getElementById('svgBackground');
        if (!canvas) {
            throw new Error("Canvas element not found");
        }
        // Render each tree on the canvas
        trees.forEach(tree => {
            renderAssetOnPosition(tree.asset, tree.placement, canvas);
        });
        // Update the display for the tree counter
        updateTreeCounterDisplay(trees.length);
        return { grid, trees };
    }
    catch (error) {
        console.error("Failed to load application state:", error);
        // Throw the error to ensure the promise is rejected
        throw error;
    }
}
//# sourceMappingURL=app.js.map