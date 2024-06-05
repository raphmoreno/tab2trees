// Define a generic type for items to be more flexible
export function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}
// Define types for the parameters to ensure they are used correctly
export function fetchAndDisplaySVG(svgFilePath, containerElement, width, height, row, col) {
    fetch(svgFilePath)
        .then(response => response.text())
        .then(svgContent => {
        const tileContainer = document.createElement('div');
        tileContainer.style.width = `${width}px`;
        tileContainer.style.height = `${height}px`;
        tileContainer.style.position = 'absolute';
        const isoX = (col - row) * width / 2;
        const isoY = (col + row) * 44;
        const isoZ = col + row;
        tileContainer.style.left = `${isoX + containerElement.offsetWidth / 2 - width / 2}px`;
        tileContainer.style.top = `${isoY}px`;
        tileContainer.style.zIndex = isoZ.toString();
        tileContainer.innerHTML = svgContent;
        containerElement.appendChild(tileContainer);
    })
        .catch(error => console.error('Error fetching SVG:', error));
}
export function updateTreeCounterDisplay(lifetimeCount) {
    const treeCounterElement = document.getElementById('treeCounter');
    if (treeCounterElement) {
        if (lifetimeCount !== undefined) {
            treeCounterElement.textContent = `${lifetimeCount}`;
        }
        else {
            chrome.storage.local.get({ lifetimeTreeCount: 0 }, function (result) {
                treeCounterElement.textContent = `${result.lifetimeTreeCount}`;
            });
        }
    }
}
export function saveForest(tiles) {
    localStorage.setItem('forestState', JSON.stringify(tiles));
}
export function loadForest() {
    try {
        const savedTiles = localStorage.getItem('forestState');
        if (!savedTiles) {
            return [];
        }
        const tiles = JSON.parse(savedTiles);
        if (Array.isArray(tiles) && tiles.length > 0) {
            return tiles;
        }
        else {
            throw new Error("Stored forest is not a valid array or it's empty");
        }
    }
    catch (error) {
        console.error("Error loading forest:", error);
        return [];
    }
}
export function toggleDebugMode(currentDebugMode) {
    const newDebugMode = !currentDebugMode;
    updateDebugVisibility(newDebugMode);
    console.log(`Debug mode is now ${newDebugMode ? 'enabled' : 'disabled'}.`);
    return newDebugMode;
}
export function updateDebugVisibility(isDebugMode) {
    const debugElements = document.querySelectorAll('.debug-button');
    debugElements.forEach(elem => {
        // Assert that each element is an HTMLElement to access the 'style' property
        elem.style.display = isDebugMode ? 'block' : 'none';
    });
}
export function toggleVisibility(elementId, visible) {
    document.getElementById(elementId).style.display = visible ? 'flex' : 'none';
}
export function displayTabCount(count) {
    const tileCountDiv = document.getElementById('tileCount');
    if (tileCountDiv) {
        if (count !== undefined && typeof count === 'number') {
            // Display the count directly if it's provided
            let treesplanted = Math.floor(count / 1000);
            let tabCountdown = 1000 - count % 1000;
            tileCountDiv.innerHTML = `<p>Total trees planted: ${treesplanted} 🌳 New tree planted in ${tabCountdown} tabs</p>`;
        }
        else {
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
}
export function safeAddEventListener(selector, event, handler) {
    const element = document.getElementById(selector);
    if (element) {
        element.addEventListener(event, handler);
    }
    else {
        console.error(`Element with selector "${selector}" not found.`);
    }
}
export function clearStorageData() {
    chrome.storage.local.remove(['forestState', 'gridState'], function () {
        console.log('forestState and gridState have been cleared from Chrome storage.');
    });
}
window.clearStorageData = clearStorageData;
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export function storeUUID(uuid) {
    chrome.storage.local.set({ userId: uuid }, function () {
        console.log('User ID is set to ' + uuid);
    });
}
export function initializeUserID() {
    chrome.storage.local.get('userId', function (result) {
        if (result.userId) {
            console.log('Existing User ID found:', result.userId);
        }
        else {
            const uuid = generateUUID();
            storeUUID(uuid);
        }
    });
}
//# sourceMappingURL=utils.js.map