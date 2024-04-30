document.addEventListener('DOMContentLoaded', initializeApp);

let isDebugMode = false;
const gridWidth = 6;
const gridHeight = 6;
const tileTypes = ['forest-1', 'forest-2', 'forest-autumn'];
const defaultBgColor = "#FFFFFF";  // Default background color
const API_KEY = '74a3227a31a8d6836732c84f29a6f015';
let forestInitialized = false;  // Flag to check if the forest has been initialized
const coinCount = getCoins();

const shopItems = [
    { id: 1, name: "Oak (Autumn)", type: "tree", cost: 30, img: "assets/SVG/tree-2.svg" },
    { id: 2, name: "Pine Tree", type: "tree", cost: 20, img: "assets/SVG/pine.svg" },
    { id: 3, name: "Cherry Blossom (spring)", type: "tree", cost: 50, img: "assets/SVG/cherry-spring.svg" },
    { id: 4, name: "Cherry Blossom (summer)", type: "option", cost: 100, img: "assets/SVG/cherry-summer.svg" },
];

function initializeApp() {
    getLocation();
    displayTileCount();
    buildListeners();
    initializeForest();
    updateDebugVisibility();
    updateTreeCounterDisplay();
    updateCoinDisplay(coinCount);
};

function buildTileSet(){
    const tileSet = [];

    return tileSet
}

// Build click listeners

function buildListeners() {
    document.getElementById('resetButton').addEventListener('click', resetForest);
    document.getElementById('shopButton').addEventListener('click', () => {toggleVisibility('shopOverlay', true);populateShop()});
    document.getElementById('overlay-cross').addEventListener('click', () => toggleVisibility('shopOverlay', false));
    document.getElementById('motherlodeButton').addEventListener('click', motherlode);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    chrome.tabs.onCreated.addListener(displayTileCount);
}

// Weather-related functions

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const { latitude, longitude } = position.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
    fetchWeather(url);
}

function fetchWeather(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
            changeBackground(data.weather[0].main);
        })
        .catch(error => console.error('Error fetching weather data:', error));
}

function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p>What's the weather like ? ${data.weather[0].main}</p>`;
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}

function changeBackground(type) {
    const bgColor = [
        { type: "Clouds", color: "#71C4C2" },
        { type: "Thunderstorm", color: "#E3BCB5" },
        { type: "Rain", color: "#c4dfdd" },
        { type: "Rain", color: "#E8D8D1" },  // Different shade for Rain
        { type: "Clear", color: "#62788d" },
        { type: "Clear", color: "#E1D8D1" },  // Different shade for Clear
        { type: "Drizzle", color: "#F7F7F7" },
        { type: "Snow", color: "#E8D8D2" }
    ];

    // Filter the array for all items matching the specified type
    let matchingTypes = bgColor.filter(item => item.type === type);

    // Select a random item from those that match
    let randomItem = matchingTypes[Math.floor(Math.random() * matchingTypes.length)];

    // Check if we have any matching items and select the color
    let newBg = randomItem ? randomItem.color : "#FFFFFF"; // Default color if no match found

    // Set the background color
    document.body.style.backgroundColor = newBg;
}

// Initialize or load the counters



function incrementTileCount() {
    fetch('http://tab.sora-mno.link/api/add-tree', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 1 })  // Increment by one each time a new tab is opened
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

function initializeForest() {
    if (!forestInitialized) {
        const tiles = loadForest();  // Load tiles
        if (tiles.length === 0) {
            // If no tiles are saved, start from scratch
            updateForestDisplay(0);
        } else {
            // If tiles exist, display them
            updateForestDisplay(tiles.length);
        }
        forestInitialized = true;  // Set the flag as initialized
    }
}

function newTabHandler() {
    chrome.storage.local.get({lifetimeTreeCount: 0}, function(data) {
        let tiles = loadForest();
        let newGridCount = tiles.length + 1; // Increment tile count
        let newLifetimeCount = data.lifetimeTreeCount + 1;
        let newCoins = getCoins();
        console.log(newCoins);

        // If newGridCount exceeds the total number of tiles the grid can hold
        if (newGridCount > gridWidth * gridHeight) {
            newGridCount = 1; // Start again with one new tile
            tiles = []; // Reset the array holding the tiles
            // Assume adding a tile for the new grid cycle
            tiles = addTile(tiles);
            newCoins += 1; // Increment coins as a reward for filling the grid
        } else {
            // Otherwise, continue adding tiles normally
            tiles = addTile(tiles);
        }

        // Update persistent storage and UI
        chrome.storage.local.set({lifetimeTreeCount: newLifetimeCount, coins:newCoins}, function() {
            saveForest(tiles); // Save the updated state
            updateForestDisplay(tiles.length); // Redraw the forest
            updateTreeCounterDisplay(newLifetimeCount); // Update display counters
            updateCoinDisplay(newCoins);
        });
    });
}


function displayTileCount(count) {
    const tileCountDiv = document.getElementById('tileCount');

    if (count !== undefined) {
        // Display the count directly if it's provided
        let treesplanted = Math.floor(count / 1000);
        let tabCountdown = 1000 - count % 1000;
        tileCountDiv.innerHTML = `<p>Total trees planted: ${treesplanted} 🚀 New tree planted in ${tabCountdown} tabs</p>`
    } else {
        // Make a GET request to fetch the count if no count is provided
        fetch('http://tab.sora-mno.link/api/tiles', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                let treesplanted = Math.floor(data.globalTileCount / 1000);
                let tabCountdown = 1000 - data.globalTileCount % 1000;
                tileCountDiv.innerHTML = `<p>Total trees planted: ${treesplanted} 🚀 New tree planted in ${tabCountdown} tabs</p>`;
            })
            .catch(error => {
                console.error('Error fetching tile count:', error);
                tileCountDiv.textContent = 'Error retrieving data';
            });
    }
}


function updateForestDisplay(count) {
    const tiles = loadForest();  // Load the saved tiles with error handling
    if (!tiles || tiles.length === 0) {
        // If no valid forest data is found or it's empty, generate from scratch
        generateAndDisplayTiles(count);
    } else {
        // Display the existing forest and add a new tile if necessary
        displayTiles(tiles);
        if (count > tiles.length) {
            // More tiles are needed than are currently displayed
            addTile(tiles);
            displayTiles(tiles);  // Re-display tiles with the new addition
            saveForest(tiles);  // Save the updated forest state
        }
    }
}

function generateAndDisplayTiles(count) {
    const forestElement = document.getElementById('isometric-grid');
    forestElement.innerHTML = ''; // Clear existing tiles
    const tiles = [];
    const positions = generateSpiralPositions(gridWidth, gridHeight);


    for (let i = 0; i < count; i++) {
        const position = positions[i];
        if (!position) break; // Avoid undefined positions if count exceeds grid size
        //const row = Math.floor(i / gridWidth);
        //const col = i % gridWidth;
        const tileType = getRandomItem(tileTypes); // Random tile type
        const tile = {
            type: tileType,
            row: position.row,
            col: position.col
        };
        tiles.push(tile);
        displayTile(tile, forestElement);
    }

    saveForest(tiles);
}

function displayTiles(tiles) {
    const forestElement = document.getElementById('isometric-grid');
    forestElement.innerHTML = ''; // Clear existing tiles

    tiles.forEach(tile => {
        displayTile(tile, forestElement);
    });
}

function displayTile(tile, container) {
    const svgFilePath = `assets/SVG/${tile.type}.svg`;
    fetchAndDisplaySVG(svgFilePath, container, 150, 100, tile.row, tile.col);
}

function addTile(tiles) {
    const positions = generateSpiralPositions(gridWidth, gridHeight);
    const tileType = getRandomItem(tileTypes);
    let newTile = {};

    if (tiles.length === 0) {
        // If no tiles exist, start with the first position
        newTile = {
            type: tileType,
            row: positions[0].row,
            col: positions[0].col
        };
    } else if (tiles.length < positions.length) {
        // Get the next position from the spiral sequence
        const nextPosition = positions[tiles.length];
        newTile = {
            type: tileType,
            row: nextPosition.row,
            col: nextPosition.col
        };
    } else {
        // All possible positions are filled, manage this scenario
        //console.log("No more positions available in the grid");
        return tiles;
    }

    tiles.push(newTile);
    return tiles;
}

function generateSpiralPositions(gridWidth, gridHeight) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = -1;
    let positions = [];
    let numSteps = gridWidth * gridHeight; // Total number of positions needed

    // Start from the middle of the grid
    let startX = Math.floor(gridWidth / 2);
    let startY = Math.floor(gridHeight / 2);

    for (let i = 0; i < numSteps; i++) {
        if ((x + startX >= 0) && (x + startX <= gridWidth) && (y + startY >= 0) && (y + startY <= gridHeight)) {
            positions.push({row: y + startY-1, col: x + startX-1});
        }

        // Check if it's time to turn
        if ((x === y) || (x < 0 && x === -y) || (x > 0 && x === 1-y)) {
            let temp = dx;
            dx = -dy;
            dy = temp;
        }

        x += dx;
        y += dy;
    }

    if (positions.length < numSteps) {
        // If not enough positions are generated (due to boundary miscalculation), log and adjust manually
        console.error("Spiral generation miscalculation. Expected: " + numSteps + ", Generated: " + positions.length);
    }

    return positions;
}



// UTILITIES 

function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function fetchAndDisplaySVG(svgFilePath, containerElement, width, height, row, col) {
    fetch(svgFilePath)
        .then(response => response.text())
        .then(svgContent => {
            const tileContainer = document.createElement('div');
            tileContainer.style.width = `${width}px`;
            tileContainer.style.height = `${height}px`;
            tileContainer.style.position = 'absolute';

            // Calculate isometric positions
            const isoX = (col - row) * width / 2;
            const isoY = (col + row) * 44;
            const isoZ = col + row;

            tileContainer.style.left = `${isoX + containerElement.offsetWidth / 2 - width / 2}px`;
            tileContainer.style.top = `${isoY}px`;
            tileContainer.style.zIndex = isoZ;
            tileContainer.innerHTML = svgContent; // Set SVG content

            containerElement.appendChild(tileContainer);
        })
        .catch(error => console.error('Error fetching SVG:', error));
}

function updateTreeCounterDisplay(lifetimeCount) {
    const treeCounterElement = document.getElementById('treeCounter');

    if (lifetimeCount !== undefined) {
        treeCounterElement.textContent = `${lifetimeCount}`; // Show lifetime count
    } else {
        chrome.storage.local.get({lifetimeTreeCount: 0}, function(result){
            treeCounterElement.textContent = `${result.lifetimeTreeCount}`; // Show lifetime count from storage
        });
    }
}

// SHOP AND MONEY HANDLING

function getCoins() {
    const coins = localStorage.getItem('coins');
    return coins ? parseInt(coins) : 0; // start with 0 coins if not set
}

function updateCoins(amount) {
    localStorage.setItem('coins', amount);
}

function getPurchasedItems() {
    const items = localStorage.getItem('purchasedItems');
    return items ? JSON.parse(items) : [];
}

function addPurchasedItem(itemId) {
    const items = getPurchasedItems();
    items.push(itemId);
    localStorage.setItem('purchasedItems', JSON.stringify(items));
    updateCoinDisplay(coinCount);
}

function updateCoinDisplay(coins){
    document.getElementById('coinCounter').textContent = `${coins}`;
}

function populateShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = ''; // Clear previous items
    const purchasedItems = getPurchasedItems();
    const exitShopBtn = document.getElementById('overlay-cross');


    shopItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item' + ` shop-item--${item.type}`;

        const img = document.createElement('img');
        img.src = item.img;
        img.alt = item.name;

        const nameP = document.createElement('p');
        nameP.textContent = item.name;

        const costP = document.createElement('div');
        costP.classList.add('shopCost-container');
        costP.innerHTML = `
        <span class="coinIcon">
            <img
                src="images/coin.png"
                alt="coins"
                height="32"
                width="32" />
        </span>
        <span>${item.cost}</span>
    `;    

        const buyButton = document.createElement('button');
        buyButton.classList.add("button-background-move");
        buyButton.textContent = 'get';
        if (purchasedItems.includes(item.id)) {
            buyButton.disabled = true;  // Disable the button if already purchased
            buyButton.textContent = 'unlocked ✔'; // Change text to indicate purchased
            itemDiv.classList.add('purchased');  // Optional: Add a class for styling
        } else {
            buyButton.addEventListener('click', () => purchaseItem(item.id, item.cost));
        }

        itemDiv.appendChild(img);
        itemDiv.appendChild(nameP);
        itemDiv.appendChild(costP);
        itemDiv.appendChild(buyButton);

        grid.appendChild(itemDiv);
    });
}


function purchaseItem(itemId, cost) {
    const currentCoins = getCoins();
    if (currentCoins >= cost) {
        updateCoins(currentCoins - cost);
        addPurchasedItem(itemId);
        showToast('Purchase successful!');
        document.getElementById('shopOverlay').style.display = 'none'; // Close the shop after purchase
    } else {
        showToast('Not enough coins!');
    }
}

function motherlode(){
    const currentCoins = getCoins();
    let newCount = currentCoins + 100;
    updateCoins(newCount);
    updateCoinDisplay(newCount);
}

// UTILITIES

// Function to save the forest state
function saveForest(tiles) {
    localStorage.setItem('forestState', JSON.stringify(tiles));    
}

function resetForest() {
    localStorage.removeItem('forestState');  // Clear the saved state
    updateForestDisplay(0);  // Reset the display with zero tiles or a default number
}

// Function to load the forest state
function loadForest() {
    try {
        const savedTiles = localStorage.getItem('forestState');
        if (!savedTiles) {
            return [];  // Return empty array if nothing is saved
        }
        const tiles = JSON.parse(savedTiles);
        if (Array.isArray(tiles) && tiles.length > 0) {
            return tiles;
        } else {
            throw new Error("Stored forest is not a valid array or it's empty");
        }
    } catch (error) {
        console.error("Error loading forest:", error);
        return [];  // Return an empty array in case of any error
    }
}

function toggleDebugMode() {
    isDebugMode = !isDebugMode;
    updateDebugVisibility();
    console.log(`Debug mode is now ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger the animation to slide in
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 100); // Wait for the DOM to update

    // Automatically hide the toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => container.removeChild(toast), 500); // Wait for animation to finish
    }, 5000);
}


function updateDebugVisibility() {
    const debugElements = document.querySelectorAll('.debug-button');
    debugElements.forEach(elem => {
        elem.style.display = isDebugMode ? 'block' : 'none';
    });
}

function toggleVisibility(elementId, visible) {
    document.getElementById(elementId).style.display = visible ? 'flex' : 'none';
}

function handleRuntimeMessage(request, sender, sendResponse) {
    if (request.action === "newTab") {
        newTabHandler();
        incrementTileCount();
    }
}