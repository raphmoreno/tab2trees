var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { updateDebugVisibility, updateTreeCounterDisplay, clearStorageData, toggleVisibility, displayTabCount, safeAddEventListener, initializeUserID } from './utils.js';
import { getLocation } from './weather.js';
import { updateForestDisplay } from './grid.js';
import { motherlode, populateShop, updateCoinDisplay, getCoins } from './shop.js';
import { config } from './config.js';
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "newTab") {
        // Handle the new tab action
        console.log("New tab detected");
        sendResponse({ status: "Received" });
        newTabHandler();
        incrementTabCount();
    }
    return true; // Important for asynchronous sendResponse
});
let forestInitialized = false; // Flag to check if the forest has been initialized
const coinCount = getCoins();
const assets = loadAssets();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeApp().then(() => {
            console.log("App initialized successfully.");
        }).catch(error => {
            console.error("Error during app initialization:", error);
        });
    }, 50);
});
// Grid dimensions based on the canvas size
const cellWidth = 30;
const cellHeight = 20;
const canvasHeight = 500;
const canvasWidth = 750;
const placementStrategy = "random";
const defaultEnvironment = {
    type: "forest",
    size: { width: 750, height: 500 },
    svgPath: "../src/assets/svg/basetiles/forest/large-forest.svg"
};
function initializeApp() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const canvas = document.getElementById('canvas');
            getLocation();
            initializeUserID();
            displayTabCount();
            let svgElement = yield loadBackground(canvas, defaultEnvironment);
            if (!svgElement) {
                throw new Error("SVG element could not be loaded.");
            }
            const grid = createIsometricGrid(canvasWidth, canvasHeight, cellWidth, cellHeight); // Example sizes
            initializeAppState();
            buildListeners(grid);
            updateDebugVisibility(config.isDebugMode);
            updateTreeCounterDisplay();
            updateCoinDisplay(coinCount);
            forestInitialized = true;
        }
        catch (error) {
            console.error("Failed to initialize the application:", error);
        }
    });
}
function buildListeners(grid) {
    var _a;
    const SVGCanvas = document.getElementById('svgBackground');
    const appSwitcherButton = document.getElementById('appSwitcherButton');
    const appSwitcherMenu = document.getElementById('appSwitcherMenu');
    safeAddEventListener('resetButton', 'click', clearStorageData);
    safeAddEventListener('shopButton', 'click', () => {
        toggleVisibility('shopOverlay', true);
        populateShop();
    });
    safeAddEventListener('overlay-cross', 'click', () => toggleVisibility('shopOverlay', false));
    safeAddEventListener('motherlodeButton', 'click', motherlode);
    window.clearStorageData = clearStorageData;
    chrome.tabs.onCreated.addListener(function () {
        displayTabCount;
    });
    // Listener for spawning random tree
    if (SVGCanvas && appSwitcherButton && appSwitcherMenu) {
        (_a = document.getElementById('test-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            spawnRandomTree(grid, SVGCanvas).catch(console.error);
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
function loadAssets() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('../src/assets/assets.json');
        if (!response.ok) {
            throw new Error('Failed to fetch assets');
        }
        return response.json();
    });
}
function createIsometricGrid(canvasWidth, canvasHeight, cellWidth, cellHeight) {
    const numRows = Math.floor(canvasHeight / cellHeight);
    const numCols = Math.floor(canvasWidth / cellWidth);
    let grid = new Array(numRows);
    for (let row = 0; row < numRows; row++) {
        grid[row] = new Array(numCols);
        for (let col = 0; col < numCols; col++) {
            // Calculate pixel offsets for isometric positioning
            const offsetX = (col - row) * cellWidth / 2 + canvasWidth / 2; // Center x on the canvas
            const offsetY = (col + row) * cellHeight / 2; // Standard staggered y position for isometry
            grid[row][col] = {
                x: col, // Grid index
                y: row, // Grid index
                offsetX: offsetX, // Canvas position
                offsetY: offsetY, // Canvas position
                available: true // Initially, all cells are available
            };
        }
    }
    return grid;
}
function markNoGoZones(grid, svgElement, noGoSelector) {
    const noGoAreas = svgElement.querySelectorAll(noGoSelector);
    noGoAreas.forEach(area => {
        const rect = area.getBBox();
        const gridArea = convertToGridCoordinates(rect, svgElement, grid[0][0].x, grid[0][0].y);
        // Mark grid cells that intersect with the no-go area as unavailable
        for (let y = gridArea.y; y < gridArea.y + gridArea.height && y < grid.length; y++) {
            for (let x = gridArea.x; x < gridArea.x + gridArea.width && x < grid[y].length; x++) {
                grid[y][x].available = false;
            }
        }
    });
}
function convertToGridCoordinates(rect, svgElement, offsetX, offsetY) {
    // Adjust coordinates to align with the isometric grid
    return {
        x: Math.floor((rect.x - offsetX) / (canvasWidth / cellWidth)),
        y: Math.floor((rect.y - offsetY) / (canvasHeight / cellHeight)),
        width: Math.ceil(rect.width / (canvasWidth / cellWidth)),
        height: Math.ceil(rect.height / (canvasHeight / cellHeight))
    };
}
function spawnAsset(asset, grid, strategy, canvas) {
    console.log("spawning a tree");
    const positions = findAvailablePositions(asset, grid);
    //console.log(positions);
    if (positions.length > 0) {
        const position = (strategy === 'random') ?
            positions[Math.floor(Math.random() * positions.length)] : // Random selection
            positions[0]; // Sequential selection
        renderAssetOnPosition(asset, position, canvas);
        markGridCells(asset, position, grid, false);
        return { asset, placement: position };
    }
    return null;
}
function findAvailablePositions(asset, grid) {
    let availablePositions = [];
    let assetGridWidth = Math.ceil(asset.groundWidth / cellWidth);
    let assetGridHeight = Math.ceil(asset.groundHeight / cellHeight);
    console.log(`Asset dimensions on grid: ${assetGridWidth} x ${assetGridHeight}`);
    // Ensure checks are made only where the entire asset can be placed
    for (let row = 0; row <= grid.length - assetGridHeight; row++) {
        for (let col = 0; col <= grid[0].length - assetGridWidth; col++) {
            let canPlace = true;
            // Validate all sub-cells for the asset's ground area
            for (let dy = 0; dy < assetGridHeight; dy++) {
                for (let dx = 0; dx < assetGridWidth; dx++) {
                    if (!grid[row + dy][col + dx].available) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace)
                    break; // Exit early if placement is already invalid
            }
            if (canPlace) {
                availablePositions.push(grid[row][col]);
                //console.log(`Valid start at: (${row}, ${col})`);
            }
        }
    }
    console.log(`Total available positions: ${availablePositions.length}`);
    return availablePositions;
}
function renderAssetOnPosition(asset, placement, canvas) {
    fetch(asset.svgPath)
        .then(response => response.text())
        .then(svgContent => {
        const tileContainer = document.createElement('div');
        tileContainer.style.width = `${asset.size.width}px`;
        tileContainer.style.height = `${asset.size.height}px`;
        tileContainer.style.position = 'absolute';
        // Use the provided placement coordinates directly
        tileContainer.style.left = `${placement.offsetX}px`;
        tileContainer.style.top = `${placement.offsetY}px`;
        tileContainer.style.zIndex = `${(placement.x + placement.y).toString()}`; // Adjust zIndex based on position
        tileContainer.innerHTML = svgContent; // Inject the SVG content
        canvas.appendChild(tileContainer);
    })
        .catch(error => console.error('Error loading SVG content:', error));
}
function markGridCells(asset, startCell, grid, available) {
    let assetGridWidth = Math.ceil(asset.groundWidth / cellWidth);
    let assetGridHeight = Math.ceil(asset.groundHeight / cellHeight);
    for (let y = 0; y < assetGridHeight; y++) {
        for (let x = 0; x < assetGridWidth; x++) {
            let targetX = startCell.x + x;
            let targetY = startCell.y + y;
            if (targetY < grid.length && targetX < grid[targetY].length) {
                grid[targetY][targetX].available = available;
            }
        }
    }
}
function spawnRandomTree(grid, canvasBase) {
    return __awaiter(this, void 0, void 0, function* () {
        const assetType = selectRandomTree();
        const asset = (yield assets).find(asset => asset.type === assetType);
        if (asset) {
            console.log(`Found asset: ${asset.type}`);
            spawnAsset(asset, grid, placementStrategy, canvasBase);
        }
        else {
            console.log(`Asset of type ${assetType} not found.`);
        }
    });
}
function loadBackground(canvas, environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(environment.svgPath);
        const svgData = yield response.text();
        let height = `${environment.size.height}px`;
        let width = `${environment.size.width}px`;
        // Clear the current canvas and set new content
        canvas.innerHTML = `<div id="svgBackground" style="height:${height}; width:${width};">${svgData}</div>`;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const svgContainer = document.getElementById('svgBackground');
                if (svgContainer) {
                    const svgElem = svgContainer.querySelector('svg');
                    if (svgElem) {
                        resolve(svgElem);
                    }
                    else {
                        reject(new Error("SVG element could not be found inside the container."));
                    }
                }
                else {
                    reject(new Error("SVG container could not be loaded."));
                }
            }, 0); // Might need adjustment based on how quickly your SVG loads/render 
        });
    });
}
function selectRandomTree() {
    const trees = config.treeConfig;
    return trees[Math.floor(Math.random() * trees.length)];
}
// Function to switch environments
function switchEnvironment(canvas, newEnvironment) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadBackground(canvas, newEnvironment);
        // Additional logic can be added here if needed, e.g., saving user preference
    });
}
function incrementTabCount() {
    fetch('http://tab.sora-mno.link/api/add-tree', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 1 }) // Increment by one each time a new tab is opened
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
function newTabHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { grid, trees } = yield loadAppState();
            const assetType = selectRandomTree();
            const newTree = (yield assets).find(asset => asset.type === assetType);
            const SVGCanvas = document.getElementById('svgBackground');
            const assetPlacement = spawnAsset(newTree, grid, placementStrategy, SVGCanvas);
            if (assetPlacement != null) {
                trees.push(assetPlacement);
                let newLifetimeCount = trees.length;
                let newCoins = getCoins() + calculateCoinIncrement(trees.length);
                // Save the updated state
                chrome.storage.local.set({
                    forestState: JSON.stringify(trees), // Save updated trees
                    gridState: JSON.stringify(grid), // Save updated grid
                    lifetimeTreeCount: newLifetimeCount,
                    coins: newCoins
                }, () => {
                    updateForestDisplay(trees.length);
                    updateTreeCounterDisplay(newLifetimeCount);
                    updateCoinDisplay(newCoins);
                    console.log("New tree planted and forest updated.");
                });
            }
        }
        catch (error) {
            console.error("Error handling new tab:", error);
        }
    });
}
function loadGrid() {
    return __awaiter(this, void 0, void 0, function* () {
        // Placeholder for grid loading logic
        const response = yield chrome.storage.local.get('gridState');
        return response.gridState ? JSON.parse(response.gridState) : createInitialGrid(); // Create or reset grid if not found
    });
}
function createInitialGrid() {
    return createIsometricGrid(canvasWidth, canvasHeight, cellWidth, cellHeight);
}
function calculateCoinIncrement(tabs) {
    // Increase coin count every 10 trees planted
    return tabs % 10 === 0 ? 1 : 0;
}
function loadAppState() {
    return __awaiter(this, void 0, void 0, function* () {
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
                    const grid = createInitialGrid();
                    const trees = [];
                    resolve({ grid, trees });
                }
            });
        });
    });
}
function initializeAppState() {
    loadAppState().then(({ grid, trees }) => {
        const canvas = document.getElementById('svgBackground');
        trees.forEach(tree => {
            renderAssetOnPosition(tree.asset, tree.placement, canvas);
        });
        updateTreeCounterDisplay(trees.length);
    }).catch(error => {
        console.error("Failed to load application state:", error);
    });
}
//# sourceMappingURL=test-app.js.map