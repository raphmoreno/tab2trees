import { fetchAndDisplaySVG, getRandomItem, loadForest, saveForest } from "./utils.js";
import { config } from './config.js';


type Position = {
    row: number;
    col: number;
};

type Tile = {
    type: string;
    row: number;
    col: number;
};

export function initializeForest(initializedState:boolean) {
    if (initializedState === true) {
        const tiles = loadForest();  // Load tiles
        if (tiles.length === 0) {
            // If no tiles are saved, start from scratch
            updateForestDisplay(0);
        } else {
            // If tiles exist, display them
            updateForestDisplay(tiles.length);
        }
        return true;  // Set the flag as initialized
    }
}

export function generateSpiralPositions(gridWidth: number, gridHeight: number): Position[] {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = -1;
    let positions: Position[] = [];
    let numSteps = gridWidth * gridHeight;

    let startX = Math.floor((gridWidth - 1) / 2);
    let startY = Math.floor((gridHeight - 1) / 2);

    for (let i = 0; i < numSteps; i++) {
        let gridX = x + startX;
        let gridY = y + startY;

        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            positions.push({ row: gridY, col: gridX });
        }

        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
            [dx, dy] = [-dy, dx];
        }

        x += dx;
        y += dy;
    }

    return positions;
}

export function updateForestDisplay(count: number): void {
    const tiles = loadForest();
    if (!tiles || tiles.length === 0) {
        generateAndDisplayTiles(count);
    } else {
        displayTiles(tiles);
        if (count > tiles.length) {
            addTile(tiles);
            displayTiles(tiles);
            saveForest(tiles);
        }
    }
}

export function generateAndDisplayTiles(count: number): void {
    const forestElement = document.getElementById('isometric-grid');
    if (forestElement) {
        forestElement.innerHTML = '';
        const tiles: Tile[] = [];
        const positions = generateSpiralPositions(config.gridWidth, config.gridHeight);

        for (let i = 0; i < count; i++) {
            const position = positions[i];
            if (!position) break;
            const tileType = getRandomItem(config.tileTypes);
            const tile: Tile = {
                type: tileType,
                row: position.row,
                col: position.col
            };
            tiles.push(tile);
            displayTile(tile, forestElement);
        }

        saveForest(tiles);
    }
}

export function displayTiles(tiles: Tile[]): void {
    const forestElement = document.getElementById('isometric-grid');
    if (forestElement) {
        forestElement.innerHTML = '';
        tiles.forEach(tile => displayTile(tile, forestElement));
    }
}

export function displayTile(tile: Tile, container: HTMLElement): void {
    const svgFilePath =`../src/assets/svg/${tile.type}.svg`;
    fetchAndDisplaySVG(svgFilePath, container, 150, 100, tile.row, tile.col);
}

export function addTile(tiles: Tile[]): Tile[] {
    const positions = generateSpiralPositions(config.gridWidth, config.gridHeight);
    if (tiles.length < positions.length) {
        const nextPosition = positions[tiles.length];
        const tileType = getRandomItem(config.tileTypes);
        const newTile: Tile = {
            type: tileType,
            row: nextPosition.row,
            col: nextPosition.col
        };
        tiles.push(newTile);
    }
    return tiles;
}

export function resetForest(): void {
    localStorage.removeItem('forestState');
    updateForestDisplay(0);
}
