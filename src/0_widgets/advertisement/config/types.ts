export type AdvertisementAssetType = "video" | "image";

export interface IAdvertisement {
  id: number;
  name: string;
  url: string;
  type: AdvertisementAssetType;
  seconds: number | null;
  store: unknown | null;
  isActive: boolean;
  tvNumber: number;
  createAt: string;
  updatedAt: string;
}

export interface IAdvertisementResponse {
  success: boolean;
  data: IAdvertisement[];
}
