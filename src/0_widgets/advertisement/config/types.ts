export interface IAdvertisement {
  id: number;
  url: string;
  seconds: number | null;
}

export interface IAdvertisementResponse {
  success: boolean;
  data: IAdvertisement[];
}
