import { config } from './config.js';
import { Asset } from "../types/assets.js";
import { AssetPlacement, GridArea, GridCell, PlacementStrategy } from "../types/grid.js";


export function findAvailablePositions(asset: Asset, grid: GridCell[][]): GridCell[] {
    let availablePositions: GridCell[] = [];
    let assetGridWidth = Math.ceil(asset.groundWidth / config.cellWidth);
    let assetGridHeight = Math.ceil(asset.groundHeight / config.cellHeight);

    //console.log(`Asset dimensions on grid: ${assetGridWidth} x ${assetGridHeight}`);

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
    //console.log(`Total available positions: ${availablePositions.length}`);
    return availablePositions;
}

export function renderAssetOnPosition(asset: Asset, placement: GridCell, canvas: SVGSVGElement): void {
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

export function markGridCells(asset: Asset, startCell: GridCell, grid: GridCell[][], available: boolean): void {
    let assetGridWidth = Math.ceil(asset.groundWidth / config.cellWidth);
    let assetGridHeight = Math.ceil(asset.groundHeight / config.cellHeight);
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

export function createIsometricGrid(canvasWidth: number, canvasHeight: number, cellWidth: number, cellHeight: number): GridCell[][] {
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

export function markNoGoZones(grid: GridCell[][], svgElement: SVGSVGElement, noGoSelector: string): void {
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

export function convertToGridCoordinates(rect: DOMRect, svgElement: SVGSVGElement, offsetX: number, offsetY: number): GridArea {
    // Adjust coordinates to align with the isometric grid
    return {
        x: Math.floor((rect.x - offsetX) / (config.canvasWidth / config.cellWidth)),
        y: Math.floor((rect.y - offsetY) / (config.canvasHeight / config.cellHeight)),
        width: Math.ceil(rect.width / (config.canvasWidth / config.cellWidth)),
        height: Math.ceil(rect.height / (config.canvasHeight / config.cellHeight))
    };
}

export function spawnAsset(asset: Asset, grid: GridCell[][], strategy: PlacementStrategy, canvas: SVGSVGElement): AssetPlacement | null {
    const positions = findAvailablePositions(asset, grid);
    //console.log(positions);

    if (positions.length > 0) {
        const position = (strategy === 'random') ?
            positions[Math.floor(Math.random() * positions.length)] : // Random selection
            positions[0]; // Sequential selection

            renderAssetOnPosition(asset, position, canvas);
        markGridCells(asset, position, grid, false);
        return {asset, placement: position}
    }
    return null;

}

export async function spawnRandomTree(
    assets: Asset[],
    grid: GridCell[][],
    canvasBase: SVGSVGElement,
    placementStrategy: PlacementStrategy
): Promise<void> {
    if (assets.length === 0) {
        console.log("No assets available to spawn.");
        return;
    }
    const asset = assets[Math.floor(Math.random() * assets.length)];
    //console.log(`Found asset: ${asset.type}`);
    spawnAsset(asset, grid, placementStrategy, canvasBase);
}

export function resetGridAvailability(grid: GridCell[][]): void {
    for (let row of grid) {
        for (let cell of row) {
            cell.available = true;
        }
    }
}