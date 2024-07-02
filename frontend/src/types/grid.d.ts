export interface GridCell {
    x: number;  // Index on the grid (column)
    y: number;  // Index on the grid (row)
    offsetX: number;  // Pixel offset on the canvas (x-coordinate)
    offsetY: number;  // Pixel offset on the canvas (y-coordinate)
    available: boolean;  // Indicates whether the cell is available for placing an asset
}

export interface AppState {
    grid: GridCell[][];
    trees: AssetPlacement[];
}

export interface AssetPlacement {
    asset: Asset;
    placement: GridCell;
}

export interface GridArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type PlacementStrategy = 'random' | 'sequential';
