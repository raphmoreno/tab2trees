// Define an interface for shop items
interface ShopItem {
    id: number;
    name: string;
    type: string;
    cost: number;
    img: string;
}

const shopItems: ShopItem[] = [
    { id: 1, name: "Oak (Autumn)", type: "tree", cost: 30, img: "../src/assets/svg/tree-2.svg" },
    { id: 2, name: "Pine Tree", type: "tree", cost: 20, img: "../src/assets/svg/pine.svg" },
    { id: 3, name: "Cherry Blossom (spring)", type: "tree", cost: 50, img: "../src/assets/svg/cherry-spring.svg" },
    { id: 4, name: "Cherry Blossom (summer)", type: "option", cost: 100, img: "../src/assets/svg/cherry-summer.svg" },
];

// SHOP AND MONEY HANDLING

export function getCoins(): number {
    const coins = localStorage.getItem('coins');
    return coins ? parseInt(coins, 10) : 0; // Use base 10 for parseInt
}

export function updateCoins(amount: number): void {
    localStorage.setItem('coins', amount.toString());
}

export function getPurchasedItems(): number[] {
    const items = localStorage.getItem('purchasedItems');
    return items ? JSON.parse(items) : [];
}

export function addPurchasedItem(itemId: number): void {
    const items = getPurchasedItems();
    items.push(itemId);
    localStorage.setItem('purchasedItems', JSON.stringify(items));
    const coins = getCoins();
    updateCoinDisplay(coins); // ensure coins is defined or retrieved before calling
}

export function updateCoinDisplay(coins: number): void {
    const coinCounterElement = document.getElementById('coinCounter');
    if (coinCounterElement) {
        coinCounterElement.textContent = `${coins}`;
    }
}

export function populateShop(): void {
    const grid = document.getElementById('shopGrid');
    if (grid) {
        grid.innerHTML = ''; // Clear previous items
        const purchasedItems = getPurchasedItems();

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
}

export function purchaseItem(itemId: number, cost: number): void {
    const currentCoins = getCoins();
    if (currentCoins >= cost) {
        updateCoins(currentCoins - cost);
        addPurchasedItem(itemId);
        showToast('Purchase successful!');
    } else {
        showToast('Not enough coins!');
    }
}

export function motherlode(): void {
    const currentCoins = getCoins();
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
