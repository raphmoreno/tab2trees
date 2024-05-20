export interface Asset {
    type: string;
    size: {
        width: number;
        height: number;
    };
    groundWidth: number;
    groundHeight: number;
    svgPath: string;
}

export interface AssetCollection {
    assets: Asset[];
}