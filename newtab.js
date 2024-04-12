const tileTypes = ['grass', 'soil', 'rocks', 'river', 'wheat'];
const assetTypes = {
    none: [],
    tree: ['oak', 'pine', 'birch'], // Example tree types
    // animal: ['fox', 'bird', 'squirrel'] // Example animal types
};
const bgColor = ["#71C4C2", "#E3BCB5", "#E8D8D2", "#F7F7F7"]


// Initialize or load the counters
chrome.storage.local.get({gridTreeCount: 0, lifetimeTreeCount: 0, coins: 0}, function(data) {
    updateForestDisplay(data.gridTreeCount);
    updateCounterDisplay(data.gridTreeCount, data.lifetimeTreeCount, data.coins);
});

// Assumes a function like this initializes or updates the display
function updateForestDisplay(count) {
    const forestElement = document.getElementById('isometric-grid');
    const background = document.body;
    background.style.backgroundColor = getRandomItem(bgColor)
    forestElement.innerHTML = ''; // Clear existing tiles

    // Assuming a fixed grid width for simplicity. Adjust as needed.
    const gridWidth = 8; // Number of tiles in a row

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridWidth);
        const col = i % gridWidth;
        const tileType = getRandomItem(tileTypes); // Random tile type
        //const svgFilePath = `assets/tiles/${tileType}/default.svg`
        const svgFilePath = `assets/forest.svg`
        // Call fetchAndDisplaySVG for each tile
        fetchAndDisplaySVG(svgFilePath, forestElement, 150, 100, row, col);

        //fetchAndDisplayPNG(tilePath, forestElement, 128, 128, row, col);
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


function fetchAndDisplayPNG(path, containerElement, width, height, row, col) {
    const img = document.createElement('img');
    img.src = path;
    img.style.width = `${width}px`; // Set width for the tile
    img.style.height = `${height}px`; // Set height for the tile

    // Calculate isometric positions
    const isoX = (col - row) * width / 2;
    const isoY = (col + row) * height / 4; // Dividing by 4 reduces the vertical overlap, adjust as necessary

    img.style.position = 'absolute';
    img.style.left = `${isoX + containerElement.offsetWidth / 2 - width / 2}px`; // Centering the grid
    img.style.top = `${isoY}px`;

    containerElement.appendChild(img);
    containerElement.style.position = 'relative';
    containerElement.style.height = `${isoY + height}px`; // Ensure the container is tall enough
}



function updateCounterDisplay(gridCount, lifetimeCount, coins) {
    document.getElementById('treeCounter').textContent = `Trees: ${lifetimeCount}`; // Show lifetime count
    document.getElementById('coinCounter').textContent = `Coins: ${coins}`;
}

// Adjusted function to handle both counters and coins
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
            updateCounterDisplay(newGridCount, newLifetimeCount, newCoins);
        });
    });
}

function loadSVG(tileType, state) {
    const path = `assets/tiles/${tileType}/${state}.svg`;
    fetch(path)
        .then(response => response.text())
        .then(svg => {
            document.getElementById('your-target-element').innerHTML = svg;
        });
}

// Reset button functionality
document.getElementById('resetButton').addEventListener('click', function() {
    chrome.storage.local.get({lifetimeTreeCount: 0, coins: 0}, function(data) {
        // Reset only the grid counter, not the lifetime counter or coins
        chrome.storage.local.set({gridTreeCount: 0}, function() {
            updateForestDisplay(0);
            updateCounterDisplay(0, data.lifetimeTreeCount, data.coins);
        });
    });
});

// Modify existing listeners to use incrementTreeCounter
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "incrementTreeCounter") {
        incrementTreeCounter();
    }
});

// Call incrementTreeCounter when a new tab is created
chrome.tabs.onCreated.addListener(function() {
    incrementTreeCounter();
});
