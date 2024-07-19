import { ShopItem, Asset, Environment } from "../types/assets";
import { GridCell } from "../types/grid";

// Define a generic type for items to be more flexible
export function getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function showFeedback(): void{
    const form = document.getElementById('feedbackForm');
    if (form){
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    } else {
    console.log ("couldn't find feedback form")
    }
}

export async function submitFeedback(): Promise<void> {
    // Type assertions are needed for DOM elements when accessed directly.
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const rating = (document.querySelector('input[name="rating"]:checked') as HTMLInputElement)?.value;
    const feedbackType = (document.getElementById('feedbackType') as HTMLSelectElement).value;
    const feedbackText = (document.getElementById('feedbackText') as HTMLTextAreaElement).value;

    // Guarding against possible null values
    if (!username || !rating || !feedbackType || !feedbackText) {
        showToast('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch('http://tab.sora-mno.link/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, rating, feedbackType, feedbackText })
        });

        if (response.ok) {
            showToast('Feedback submitted successfully!');
            // Ensure the feedback form can be hidden safely
            const feedbackForm = document.getElementById('feedbackForm');
            if (feedbackForm) feedbackForm.style.display = 'none';
        } else {
            throw new Error('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showToast('Error submitting feedback');
    }
}

// Define types for the parameters to ensure they are used correctly
export function fetchAndDisplaySVG(svgFilePath: string, containerElement: HTMLElement, width: number, height: number, row: number, col: number): void {
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

export async function updateTreeCounterDisplay(lifetimeCount?: number): Promise<void> {
    const treeCounterElement = document.getElementById('treeCounter');
    if (treeCounterElement) {
        if (lifetimeCount !== undefined) {
            treeCounterElement.textContent = `${lifetimeCount}`;
        } else {
            // Fetch the userId correctly
            chrome.storage.local.get('userId', async (result) => {
                const userId = result.userId;
                if (userId) {
                    try {
                        const { tabCount } = await fetchUserData(userId);
                        treeCounterElement.textContent = `${tabCount}`;
                    } catch (error) {
                        console.error('Failed to fetch user data:', error);
                        // Optionally set some fallback or error message
                        treeCounterElement.textContent = 'Error';
                    }
                } else {
                    console.error('User ID not found');
                    treeCounterElement.textContent = 'Error'; // Handle the case where userId is not found
                }
            });
        }
    }
}


export function saveForest(tiles: any[]): void {
    localStorage.setItem('forestState', JSON.stringify(tiles));
}

export function loadForest(): any[] {
    try {
        const savedTiles = localStorage.getItem('forestState');
        if (!savedTiles) {
            return [];
        }
        const tiles = JSON.parse(savedTiles);
        if (Array.isArray(tiles) && tiles.length > 0) {
            return tiles;
        } else {
            throw new Error("Stored forest is not a valid array or it's empty");
        }
    } catch (error) {
        console.error("Error loading forest:", error);
        return [];
    }
}

export function toggleDebugMode(currentDebugMode: boolean): boolean {
    const newDebugMode = !currentDebugMode;
    updateDebugVisibility(newDebugMode);
    console.log(`Debug mode is now ${newDebugMode ? 'enabled' : 'disabled'}.`);
    return newDebugMode;
}


export function updateDebugVisibility(isDebugMode: boolean): void {
    const debugElements = document.querySelectorAll('.debug-button');
    debugElements.forEach(elem => {
        // Assert that each element is an HTMLElement to access the 'style' property
        (elem as HTMLElement).style.display = isDebugMode ? 'block' : 'none';
    });
}

export function toggleVisibility(elementId: string, visible: boolean): void {
    document.getElementById(elementId)!.style.display = visible ? 'flex' : 'none';
}

export function displayGlobalTabCount(count?: string) {
    const tileCountDiv = document.getElementById('tileCount');
    if (tileCountDiv) {
        if (count !== undefined && typeof count === 'number') {
            // Display the count directly if it's provided
            let treesplanted = Math.floor(count / 1000);
            let tabCountdown = 1000 - count % 1000;
            tileCountDiv.innerHTML = `<p>Total trees planted: ${treesplanted} 🌳 New tree planted in ${tabCountdown} tabs</p>`
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
}

export function safeAddEventListener(selector: string, event: string, handler: EventListenerOrEventListenerObject): void {
    const element = document.getElementById(selector);
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.error(`Element with selector "${selector}" not found.`);
    }
}

export function clearStorageData(): void {
    chrome.storage.local.remove(['forestState', 'gridState'], function () {
        console.log('forestState and gridState have been cleared from Chrome storage.');
    });
}

(window as any).clearStorageData = clearStorageData;

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function storeUUID(uuid: string) {
    chrome.storage.local.set({ userId: uuid }, function () {
        //console.log('User ID is set to ' + uuid);
    });
}

export function initializeUserID() {
    chrome.storage.local.get('userId', function (result) {
        if (result.userId) {
            //console.log('Existing User ID found:', result.userId);
        } else {
            const uuid = generateUUID();
            storeUUID(uuid);
        }
    });
}

export async function loadAssets(purchasedItems: ShopItem[]): Promise<Asset[]> {
    const response = await fetch('../src/assets/assets.json');
    if (!response.ok) {
        throw new Error('Failed to fetch assets');
    }
    const fetchedAssets = await response.json() as Asset[];

    // Create an array of typeIds from the purchasedItems
    const purchasedTypeIds = purchasedItems.map(item => item.typeId);

    // Filter fetched assets based on whether their type is in the list of purchased item typeIds
    const resultAssets = fetchedAssets.filter(asset => purchasedTypeIds.includes(asset.type));

    return resultAssets;
}

export async function loadBackground(canvas: HTMLElement, environment: Environment): Promise<SVGSVGElement | null> {
    const response = await fetch(environment.svgPath);
    const svgData = await response.text();
    let height = `${environment.size.height}px`;
    let width = `${environment.size.width}px`;

    // Clear the current canvas and set new content
    canvas.innerHTML = `<div id="svgBackground" style="height:${height}; width:${width};">${svgData}</div>`;

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const svgContainer = document.getElementById('svgBackground');
            if (svgContainer) {
                const svgElem = svgContainer.querySelector('svg') as SVGSVGElement;
                if (svgElem) {
                    resolve(svgElem);
                } else {
                    reject(new Error("SVG element could not be found inside the container."));
                }
            } else {
                reject(new Error("SVG container could not be loaded."));
            }
        }, 0); // Might need adjustment based on how quickly your SVG loads/render 
    });
}

export async function switchEnvironment(canvas: HTMLElement, newEnvironment: Environment): Promise<void> {
    await loadBackground(canvas, newEnvironment);
    // Additional logic can be added here if needed, e.g., saving user preference
}

export async function fetchUserData(userId: string) {
    try {
        const response = await fetch(`http://tab.sora-mno.link/api/user?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        const tabCount = data.tab_Count || 0; // Default to 0 if undefined
        const coinCount = data.coin_count || 0; // Default to 0 if undefined
        console.log('Tab Count:', tabCount, 'Coin Count:', coinCount);
        return { tabCount, coinCount };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error; // Rethrow or handle as necessary
    }
}

export function showToast(message: string) {
    const container = document.getElementById('toast-container');
    if(container){
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
}

export async function getFromChromeStorage(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                // Handle errors when chrome storage fails
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]); // Return the specific key result
            }
        });
    });
}

export async function fetchUserId() {
    try {
        const userId = await getFromChromeStorage('userId');
        console.log('Retrieved User ID:', userId);
        return userId; // Use or return the userId as needed
    } catch (error) {
        console.error('Failed to retrieve user ID:', error);
    }
}

