document.addEventListener('DOMContentLoaded', function() {
    getLocation();
    displayTileCount();
    buildListeners()
});

const tileTypes = ['grass', 'soil', 'rocks', 'river', 'wheat'];
const assetTypes = {
    none: [],
    treeTypes: ['oak', 'pine', 'birch'], 
    // animalTypes: ['fox', 'bird', 'squirrel'] // animal types
};
const bgColor = ["#71C4C2", "#E3BCB5", "#E8D8D2", "#F7F7F7"]
const shopItems = [
    { id: 1, name: "Pine Tree", type:"tree", cost: 100, img: "images/tree-48.png" },
    { id: 2, name: "Oak Tree", type:"tree", cost: 150, img: "images/tree-48.png" },
    { id: 3, name: "Cherry Blossom", type:"option", cost: 200, img: "images/tree-48.png" },
    { id: 4, name: "Cherry Blossom", type:"tree", cost: 250, img: "images/tree-48.png" },    
    { id: 5, name: "Cherry Blossom", type:"option", cost: 300, img: "images/tree-48.png" },
    { id: 6, name: "Cherry Blossom", type:"tree", cost: 50, img: "images/tree-48.png" },
    { id: 7, name: "Cherry Blossom", type:"animal", cost: 100, img: "images/tree-48.png" },
    { id: 8, name: "Cherry Blossom", type:"env", cost: 123, img: "images/tree-48.png" },
    { id: 9, name: "Cherry Blossom", type:"environment", cost: 1023, img: "images/tree-48.png" },
    { id: 10, name: "Cherry Blossom", type:"environment", cost: 999, img: "images/tree-48.png" }

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
}

// Initialize or load the counters

const coinCount = localStorage.getItem('coins');

chrome.storage.local.get({gridTreeCount: 0, lifetimeTreeCount: 0, coins: 0}, function(data) {
    updateForestDisplay(data.gridTreeCount);
    updateTreeCounterDisplay(data.gridTreeCount, data.lifetimeTreeCount);
    updateCoinDisplay(coinCount);
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
    const forestElement = document.getElementById('isometric-grid');
    const background = document.body;
    background.style.backgroundColor = getRandomItem(bgColor)
    displayTileCount();
    forestElement.innerHTML = ''; // Clear existing tiles

    const gridWidth = 8; // Number of tiles in a row

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridWidth);
        const col = i % gridWidth;
        const tileType = getRandomItem(tileTypes); // Random tile type
        const forestType = getRandomItem(["forest-1", "forest-autumn", "forest-2"])
        const svgFilePath = `assets/SVG/${forestType}.svg`
        // const svgFilePath = `assets/SVG/forest-tile-naked.svg`
        // Call fetchAndDisplaySVG for each tile
        fetchAndDisplaySVG(svgFilePath, forestElement, 150, 100, row, col);
    }
}

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


function updateTreeCounterDisplay(gridCount, lifetimeCount, coins) {
    document.getElementById('treeCounter').textContent = `Trees: ${lifetimeCount}`; // Show lifetime count
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
    document.getElementById('coinCounter').textContent = `Coins: ${coins}`;
}

function populateShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = ''; // Clear previous items
    const purchasedItems = getPurchasedItems();
    const exitShopBtn = document.getElementById('overlay-cross');


    shopItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item' + `shop-item--${item.type}`;

        const img = document.createElement('img');
        img.src = item.img;
        img.alt = item.name;

        const nameP = document.createElement('p');
        nameP.textContent = item.name;

        const costP = document.createElement('p');
        costP.textContent = `${item.cost} Coins`;

        const buyButton = document.createElement('button');
        buyButton.textContent = 'Buy';
        if (purchasedItems.includes(item.id)) {
            buyButton.disabled = true;  // Disable the button if already purchased
            buyButton.textContent = 'Purchased ✔'; // Change text to indicate purchased
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
        alert('Purchase successful!');
        document.getElementById('shopOverlay').style.display = 'none'; // Close the shop after purchase
    } else {
        alert('Not enough coins!');
    }
}

function motherlode(){
    const currentCoins = getCoins();
    let newCount = currentCoins + 100;
    updateCoins(newCount);
    updateCoinDisplay(newCount);
}


function incrementTreeCounter() {
    chrome.storage.local.get({gridTreeCount: 0, lifetimeTreeCount: 0, coins: 0}, function(data) {
        let newGridCount = data.gridTreeCount + 1;
        let newLifetimeCount = data.lifetimeTreeCount + 1; // This counter never resets
        let newCoins = data.coins;
        
        // Check if the grid is full, then reset grid counter and increment coins
        if(newGridCount >= 48) { // For an 8x6 grid
            newGridCount = 0; // Reset grid tree count for a new grid
            newCoins++; // Increment coins
        }

        chrome.storage.local.set({gridTreeCount: newGridCount, lifetimeTreeCount: newLifetimeCount, coins: newCoins}, function() {
            updateForestDisplay(newGridCount);
            updateTreeCounterDisplay(newGridCount, newLifetimeCount);
            updateCoinDisplay(newCoins);
        });
    });
}

// UTILITIES

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "newTab") {
        incrementTreeCounter();
        incrementTileCount();
        console.log("message received")
    }
});

chrome.tabs.onCreated.addListener(function() {
    console.log("update triggered")
    displayTileCount()
});
