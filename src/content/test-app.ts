import { updateDebugVisibility, updateTreeCounterDisplay, toggleVisibility, saveForest, loadForest, displayTileCount, safeAddEventListener } from './utils.js';
import { config } from './config.js';
import { env } from 'process';
import { Asset } from '../types/assets.js';
import { clearLine } from 'readline';

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeApp().then(() => {
        console.log("App initialized successfully.");
    }).catch(error => {
        console.error("Error during app initialization:", error);
    });
}
    , 50)
});

async function loadAssets(): Promise<Asset[]> {
    const response = await fetch('../src/assets/assets.json');
    if (!response.ok) {
        throw new Error('Failed to fetch assets');
    }
    return response.json();
}

const assets = loadAssets()

// Grid dimensions based on the canvas size
const cellWidth = 30; 
const cellHeight = 20;
const canvasHeight = 500; 
const canvasWidth = 750; 

interface GridArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface AssetPlacement {
    x: number;
    y: number;
}

interface Environment {
    type: string;
    size: { width: number; height: number };
    svgPath: string;
}

interface GridCell {
    x: number;  // Index on the grid (column)
    y: number;  // Index on the grid (row)
    offsetX: number;  // Pixel offset on the canvas (x-coordinate)
    offsetY: number;  // Pixel offset on the canvas (y-coordinate)
    available: boolean;  // Indicates whether the cell is available for placing an asset
}

type PlacementStrategy = 'random' | 'sequential';

const placementStrategy = "random" as PlacementStrategy

const defaultEnvironment: Environment = {
    type: "forest",
    size: {width: 750,height: 500},
    svgPath: "../src/assets/svg/basetiles/forest/forest-1.svg"
};

async function initializeApp() {
    try {
        const canvas = document.getElementById('canvas') as HTMLElement;
        let svgElement = await loadBackground(canvas, defaultEnvironment);
        if (!svgElement) {
            throw new Error("SVG element could not be loaded.");
        }
        const grid = createIsometricGrid(canvasWidth, canvasHeight, cellWidth, cellHeight); // Example sizes
        console.log(grid);
        buildListeners(grid);
        markNoGoZones(grid, svgElement, '[data-nogo="true"]');        
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
}

function buildListeners(grid:GridCell[][]) {
    const SVGCanvas = document.getElementById('svgBackground') as unknown as SVGSVGElement;
    if (SVGCanvas) {
        document.getElementById('test-button')?.addEventListener('click', () => {
            spawnRandomTree(grid, SVGCanvas).catch(console.error);
        });
    }
}

function createIsometricGrid(canvasWidth: number, canvasHeight: number, cellWidth: number, cellHeight: number): GridCell[][] {
    const numRows = Math.floor(canvasHeight / cellHeight);
    const numCols = Math.floor(canvasWidth / cellWidth);

    let grid = new Array<Array<GridCell>>(numRows);

    for (let row = 0; row < numRows; row++) {
        grid[row] = new Array<GridCell>(numCols);
        for (let col = 0; col < numCols; col++) {
            // Calculate pixel offsets for isometric positioning
            const offsetX = (col - row) * cellWidth / 2 + canvasWidth / 2; // Center x on the canvas
            const offsetY = (col + row) * cellHeight / 2; // Standard staggered y position for isometry
            grid[row][col] = {
                x: col,  // Grid index
                y: row,  // Grid index
                offsetX: offsetX,  // Canvas position
                offsetY: offsetY,  // Canvas position
                available: true  // Initially, all cells are available
            };
        }
    }
    return grid;
}

function markNoGoZones(grid: GridCell[][], svgElement: SVGSVGElement, noGoSelector: string): void {
    const noGoAreas = svgElement.querySelectorAll(noGoSelector);

    noGoAreas.forEach(area => {
        const rect = (area as SVGGraphicsElement).getBBox();
        const gridArea = convertToGridCoordinates(rect, svgElement, grid[0][0].x, grid[0][0].y);

        // Mark grid cells that intersect with the no-go area as unavailable
        for (let y = gridArea.y; y < gridArea.y + gridArea.height && y < grid.length; y++) {
            for (let x = gridArea.x; x < gridArea.x + gridArea.width && x < grid[y].length; x++) {
                grid[y][x].available = false;
            }
        }
    });
}

function convertToGridCoordinates(rect: DOMRect, svgElement: SVGSVGElement, offsetX: number, offsetY: number): GridArea {
    // Adjust coordinates to align with the isometric grid
    return {
        x: Math.floor((rect.x - offsetX) / (canvasWidth / cellWidth)),
        y: Math.floor((rect.y - offsetY) / (canvasHeight / cellHeight)),
        width: Math.ceil(rect.width / (canvasWidth / cellWidth)),
        height: Math.ceil(rect.height / (canvasHeight / cellHeight))
    };
}

function spawnAsset(asset: Asset, grid: GridCell[][], strategy: PlacementStrategy, canvas: SVGSVGElement): void {
    const positions = findAvailablePositions(asset, grid);
    //console.log(positions);

    if (positions.length > 0) {
        const position = (strategy === 'random') ?
            positions[Math.floor(Math.random() * positions.length)] : // Random selection
            positions[0]; // Sequential selection

            renderAssetOnPosition(asset, position, canvas);
        markGridCells(asset, position, grid, false);
    }
}

function findAvailablePositions(asset: Asset, grid: GridCell[][]): GridCell[] {
    let availablePositions: GridCell[] = [];
    let assetGridWidth = Math.ceil(asset.groundWidth / cellWidth);
    let assetGridHeight = Math.ceil(asset.groundHeight / cellHeight);

    console.log(`Asset dimensions on grid: ${assetGridWidth} x ${assetGridHeight}`);

    // Ensure checks are made only where the entire asset can be placed
    for (let row = 0; row <= grid.length - assetGridHeight; row++) {
        for (let col = 0; col <= grid[0].length - assetGridWidth; col++) {
            let canPlace = true;
            // Validate all sub-cells for the asset's ground area
            for (let dy = 0; dy < assetGridHeight; dy++) {
                for (let dx = 0; dx < assetGridWidth; dx++) {
                    if (!grid[row + dy][col + dx].available) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break; // Exit early if placement is already invalid
            }
            if (canPlace) {
                availablePositions.push(grid[row][col]);
                //console.log(`Valid start at: (${row}, ${col})`);
            }
        }
    }
    console.log(`Total available positions: ${availablePositions.length}`);
    return availablePositions;
}

function renderAssetOnPosition(asset: Asset, placement: GridCell, canvas: SVGSVGElement): void {
    fetch(asset.svgPath)
        .then(response => response.text())
        .then(svgContent => {
            const tileContainer = document.createElement('div');
            tileContainer.style.width = `${asset.size.width}px`;
            tileContainer.style.height = `${asset.size.height}px`;
            tileContainer.style.position = 'absolute';
            
            // Use the provided placement coordinates directly
            tileContainer.style.left = `${placement.offsetX}px`;
            tileContainer.style.top = `${placement.offsetY}px`;
            tileContainer.style.zIndex = `${(placement.x + placement.y).toString()}`; // Adjust zIndex based on position

            tileContainer.innerHTML = svgContent; // Inject the SVG content

            canvas.appendChild(tileContainer);
        })
        .catch(error => console.error('Error loading SVG content:', error));
}

function markGridCells(asset: Asset, startCell: GridCell, grid: GridCell[][], available: boolean): void {
    let assetGridWidth = Math.ceil(asset.groundWidth / 22.5);
    let assetGridHeight = Math.ceil(asset.groundHeight / 15);
    for (let y = 0; y < assetGridHeight; y++) {
        for (let x = 0; x < assetGridWidth; x++) {
            let targetX = startCell.x + x;
            let targetY = startCell.y + y;
            if (targetY < grid.length && targetX < grid[targetY].length) {
                grid[targetY][targetX].available = available;
            }
        }
    }
}

async function spawnRandomTree(grid:GridCell[][], canvasBase: SVGSVGElement): Promise<void> {
    const assetType = selectRandomTree();
    const asset = (await assets).find(asset => asset.type === assetType) as Asset;

    if (asset) {
        console.log(`Found asset: ${asset.type}`);
        spawnAsset(asset, grid, placementStrategy, canvasBase)
    } else {
        console.log(`Asset of type ${assetType} not found.`);
    }
}

async function loadBackground(canvas: HTMLElement, environment: Environment): Promise<SVGSVGElement | null> {
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

function selectRandomTree() {
    const trees = config.treeConfig;
    return trees[Math.floor(Math.random() * trees.length)];
}

// Function to switch environments
async function switchEnvironment(canvas: HTMLElement, newEnvironment: Environment): Promise<void> {
    await loadBackground(canvas, newEnvironment);
    // Additional logic can be added here if needed, e.g., saving user preference
}