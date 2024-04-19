document.addEventListener('DOMContentLoaded', function() {
    getLocation();
});

const tileTypes = ['grass', 'soil', 'rocks', 'river', 'wheat'];
const assetTypes = {
    none: [],
    treeTypes: ['oak', 'pine', 'birch'], 
    // animalTypes: ['fox', 'bird', 'squirrel'] // animal types
};
const bgColor = ["#71C4C2", "#E3BCB5", "#E8D8D2", "#F7F7F7"]

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
    weatherInfo.innerHTML = `
        <h3>Weather Information</h3>
        <p>Temperature: ${data.main.temp} °C</p>
        <p>Weather: ${data.weather[0].main}</p>
        <p>Humidity: ${data.main.humidity}%</p>
    `;
}

// Initialize or load the counters
chrome.storage.local.get({gridTreeCount: 0, lifetimeTreeCount: 0, coins: 0}, function(data) {
    updateForestDisplay(data.gridTreeCount);
    updateCounterDisplay(data.gridTreeCount, data.lifetimeTreeCount, data.coins);
});

function updateTileCount() {
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

function updateForestDisplay(count) {
    const forestElement = document.getElementById('isometric-grid');
    const background = document.body;
    background.style.backgroundColor = getRandomItem(bgColor)
    forestElement.innerHTML = ''; // Clear existing tiles

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

function displayTileCount(count) {
    const tileCountDiv = document.getElementById('tileCount');
    tileCountDiv.textContent = `Global Tiles Created: ${count}`;
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
    const isoY = (col + row) * height / 4; // Dividing by 4 reduces the vertical overlap

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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "incrementTreeCounter") {
        incrementTreeCounter();
    }
});

chrome.tabs.onCreated.addListener(function() {
    incrementTreeCounter();
});
