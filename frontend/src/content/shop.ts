import { fetchUserData } from "./utils.js";

// Define an interface for shop items
interface ShopItem {
    id: number;
    name: string;
    type: string;
    cost: number;
    img: string;
    typeId: string;
    comingSoon?: boolean;
}

const shopItems: ShopItem[] = [
    { id: 1, name: "Oak (Autumn)", type: "tree", cost: 30, img: "../src/assets/svg/tree-2.svg", typeId:'oak-autumn' },
    { id: 2, name: "Pine Tree", type: "tree", cost: 20, img: "../src/assets/svg/pine.svg", typeId:'pine' },
    { id: 3, name: "Cherry Blossom (spring)", type: "tree", cost: 50, img: "../src/assets/svg/cherry-spring.svg", typeId:'cherry-blossom-spring' },
    { id: 4, name: "Cherry Blossom (summer)", type: "option", cost: 100, img: "../src/assets/svg/cherry-summer.svg", typeId:'cherry-blossom-summer' },
    { id: 5, name: "Jungle", type: "environment", cost: 200, img: "../src/assets/svg/basetiles/jungle/shop.svg", typeId:'jungle', comingSoon: true },
    { id: 6, name: "Savanah", type: "environment", cost: 200, img: "../src/assets/svg/basetiles/savannah/shop.svg", typeId:'jungle', comingSoon: true },
];

// SHOP AND MONEY HANDLING

export async function getCoins(): Promise<number> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('userId', (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error retrieving user ID:', chrome.runtime.lastError.message);
                reject(new Error('Failed to retrieve user ID'));
            } else if (!result.userId) {
                console.error('User ID not found in local storage.');
                reject(new Error('User ID not found'));
            } else {
                fetchUserData(result.userId).then(userData => {
                    resolve(userData.coinCount);
                }).catch(error => {
                    console.error('Error retrieving coins:', error);
                    reject(new Error('Failed to retrieve coin count'));
                });
            }
        });
    });
}

export async function updateCoins(coinChange: number): Promise<void> {
    try {
        const userId = await chrome.storage.local.get('userId');
        const response = await fetch('http://tab.sora-mno.link/api/updateCoins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, coinChange })
        });
        const data = await response.json();
        if (response.ok) {
            updateCoinDisplay(data.coinCount);
        } else {
            throw new Error(data.message || 'Failed to update coins');
        }
    } catch (error) {
        console.error('Error updating coins:', error);
        showToast('Failed to update coins');
    }
}

export function getPurchasedItems(): Promise<ShopItem[]> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('purchasedItems', (result) => {
            if (chrome.runtime.lastError) {
                // Handle possible errors that might have occurred when fetching data
                reject(chrome.runtime.lastError);
            } else {
                // Parse the items or return an empty array if no items are stored
                const items = result['purchasedItems'];
                resolve(items ? JSON.parse(items) : []);
            }
        });
    });
}

export async function addPurchasedItem(item: ShopItem): Promise<void> {
    try {
        const items = await getPurchasedItems();
        items.push(item); // Now you can push to the array since it's been awaited and is no longer a promise
        chrome.storage.local.set({purchasedItems: JSON.stringify(items)});
    } catch (error) {
        console.error("Error adding purchased item:", error);
        // Handle the error appropriately
    }
}

export function updateCoinDisplay(coins: number): void {
    const coinCounterElement = document.getElementById('coinCounter');
    if (coinCounterElement) {
        coinCounterElement.textContent = `${coins}`;
    }
}

export async function populateShop(): Promise<void> {
    const grid = document.getElementById('shopGrid');
    if (grid) {
        grid.innerHTML = ''; // Clear previous items
        const purchasedItems = await getPurchasedItems();

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
                    src="../src/assets/images/coin.png"
                    alt="coins"
                    height="32"
                    width="32" />
            </span>
            <span>${item.cost}</span>
            `;    

            const buyButton = document.createElement('button');
            buyButton.classList.add("button-background-move");
            buyButton.textContent = 'get';
            if (purchasedItems.some(purchasedItem => purchasedItem.id === item.id)) {
                buyButton.disabled = true;  // Disable the button if already purchased
                buyButton.textContent = 'unlocked ✔'; // Change text to indicate purchased
                itemDiv.classList.add('purchased');  // Optional: Add a class for styling
            } else {
                buyButton.addEventListener('click', () => purchaseItem(item));
            }

            itemDiv.appendChild(img);
            itemDiv.appendChild(nameP);
            itemDiv.appendChild(costP);
            itemDiv.appendChild(buyButton);

            grid.appendChild(itemDiv);
        });
    }
}

export async function purchaseItem(item: ShopItem): Promise<void> {
    const currentCoins = await getCoins();
    if (currentCoins >= item.cost) {
        updateCoins(currentCoins - item.cost);
        addPurchasedItem(item);
        showToast('Purchase successful!');
    } else {
        showToast('Not enough coins!');
    }
}

export async function motherlode(): Promise<void> {
    const currentCoins = await getCoins();
    const newCount = currentCoins + 100;
    updateCoins(newCount);
    updateCoinDisplay(newCount);
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

export function incrementCoins(coin: number) {
    chrome.storage.local.get('userId', function (result) {
        const userId = result.userId

        fetch('http://tab.sora-mno.link/api/update-coins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, coin })  // Increment coins
        })
            .then(response => response.json())
            .then(data => {
                updateCoinDisplay(data.coinCount);
                triggerCoinanimation(coin)
            })
            .catch(error => {
                console.error('Error updating coin count:', error)
            });
    })
}

export function triggerCoinanimation(coin:number){
        const coinCounter = document.getElementById('coinCounter');
        if (coinCounter) {
            const animation = document.createElement('span');
            animation.textContent = `+${coin}`;
            animation.className = 'coin-animation';
            coinCounter.appendChild(animation);
            setTimeout(() => coinCounter.removeChild(animation), 1000); // Animation lasts for 1 second
        }
}
