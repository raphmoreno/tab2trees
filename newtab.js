document.addEventListener('DOMContentLoaded', function() {
    getLocation();
    displayTileCount();
    buildListeners();
    updateDebugVisibility();  // Initialize debug button visibility

});
let isDebugMode = false;

const gridWidth = 6;

function buildTileSet(){
    const tileSet = [];

    return tileSet
}

const tileTypes = ['forest-1', 'forest-2', 'forest-autumn'];

const shopItems = [
    { id: 1, name: "Oak (Autumn)", type:"tree", cost: 30, img: "assets/SVG/tree-2.svg" },
    { id: 2, name: "Pine Tree", type:"tree", cost: 20, img: "assets/SVG/pine.svg" },
    { id: 3, name: "Cherry Blossom (spring)", type:"tree", cost: 50, img: "assets/SVG/cherry-spring.svg" },
    { id: 4, name: "Cherry Blossom (summer)", type:"option", cost: 100, img: "assets/SVG/cherry-summer.svg" },
];

// Build click listeners

function buildListeners(){
    document.getElementById('resetButton').addEventListener('click', function() {
        chrome.storage.local.get({lifetimeTreeCount: 0, coins: 0}, function(data) {
            // Reset only the grid counter, not the lifetime counter or coins
            chrome.storage.local.set({gridTreeCount: 0}, function() {
                updateForestDisplay(0);
                updateTreeCounterDisplay(0, data.lifetimeTreeCount);
            });
        });
    });
    document.getElementById('shopButton').addEventListener('click', function() {
        document.getElementById('shopOverlay').style.display = 'flex';
        populateShop();
    });
    document.getElementById('overlay-cross').addEventListener('click', function() {
        document.getElementById('shopOverlay').style.display = 'none';
    });
    document.getElementById('motherlodeButton').addEventListener('click', motherlode)
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
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    fetchWeather(latitude, longitude); 
}

function fetchWeather(lat, lon) {
    const apiKey = '74a3227a31a8d6836732c84f29a6f015'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => displayWeather(data))
        .catch(error => console.error('Error fetching weather data:', error));
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

function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `<p>What's the weather like ? ${data.weather[0].main}</p>`;
    changeBackground(data.weather[0].main)
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

const coinCount = getCoins();
updateCoinDisplay(coinCount);

chrome.storage.local.get({lifetimeTreeCount: 0}, function(data) {
    var tiles = loadForest();
    console.log("forest size = " + tiles.length)
    if(tiles.length < 36){
        updateForestDisplay(tiles.length);
    }
    updateTreeCounterDisplay(data.tiles.length, data.lifetimeTreeCount);
});

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

function newTabHandler() {
    chrome.storage.local.get({lifetimeTreeCount: 0}, function(data) {
        let tiles = loadForest();
        let newGridCount = tiles.length + 1;
        let newLifetimeCount = data.lifetimeTreeCount + 1; // This counter never resets
        var newCoins = getCoins();
        
        // Check if the grid is full, then reset grid counter and increment coins
        if(newGridCount > 6 * gridWidth) { // For an 6x6 grid
            
            // Reset grid
            newGridCount = 0;
            updateForestDisplay(0);
            tiles = [];
            
            // Increment coins
            newCoins=newCoins+1;
            updateCoins(newCoins);
            updateCoinDisplay(newCoins);
             
        }
        let newTiles = addTile(tiles);

        chrome.storage.local.set({lifetimeTreeCount: newLifetimeCount}, function() {
            saveForest(newTiles);
            updateForestDisplay(newTiles.length);
            updateTreeCounterDisplay(newLifetimeCount);
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
    const tiles = loadForest();  // Attempt to load saved tiles
    if (tiles.length == 0 || count == 0 ) {
        console.log("no tiles found, rebuilding forest" + count)
        generateAndDisplayTiles(count);
    } else {
        console.log("found a forest" + tiles)
        displayTiles(tiles);
    }
}

function generateAndDisplayTiles(count) {
    const forestElement = document.getElementById('isometric-grid');
    forestElement.innerHTML = ''; // Clear existing tiles
    const tiles = [];

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridWidth);
        const col = i % gridWidth;
        const tileType = getRandomItem(tileTypes); // Random tile type
        const tile = {
            type: tileType,
            row: row,
            col: col
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
    const tileType = getRandomItem(tileTypes);
    let newTile = {};

    if (tiles.length === 0) {
        // If no tiles exist, start with the first position
        newTile = {
            type: tileType,
            row: 0,
            col: 0
        };
    } else {
        // Get the last tile added to calculate the new tile's position
        const lastTile = tiles[tiles.length - 1];
        
        if (lastTile.col === gridWidth - 1) {
            // If the last tile was at the end of a row, start a new row
            newTile = {
                type: tileType,
                row: lastTile.row + 1,
                col: 0
            };
        } else {
            // Otherwise, continue in the same row
            newTile = {
                type: tileType,
                row: lastTile.row,
                col: lastTile.col + 1
            };
        }
    }
    console.log(newTile.row, newTile.col);
    tiles.push(newTile);
    return tiles;
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
    document.getElementById('treeCounter').textContent = `${lifetimeCount}`; // Show lifetime count
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
    console.log("forest saved !")
}

function resetForest() {
    localStorage.removeItem('forestState');  // Clear the saved state
    updateForestDisplay(0);  // Reset the display with zero tiles or a default number
}

// Function to load the forest state
function loadForest() {
    const savedTiles = localStorage.getItem('forestState');
    return savedTiles ? JSON.parse(savedTiles) : null;
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "newTab") {
        newTabHandler();
        incrementTileCount();
    }
});

chrome.tabs.onCreated.addListener(function() {
    console.log("update triggered")
    displayTileCount()
});
