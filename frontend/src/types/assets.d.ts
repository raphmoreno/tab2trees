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

export interface ShopItem {
    id: number;
    name: string;
    type: string;
    cost: number;
    img: string;
    typeId: string;
    comingSoon?: boolean;
}

export interface Environment {
    type: string;
    size: { width: number; height: number };
    svgPath: string;
}