"use client";

import { usePadConnection } from "@features/pad-connection";
import {
  AdvertisementCard,
  IAdvertisementResponse,
} from "@widgets/advertisement";
import { useEffect, useState } from "react";

const getAdvertisements = async (idStore: number): Promise<IAdvertisementResponse> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
    const url = `${baseUrl}/banner-tv/get-all-store-bunner-tv/${idStore}`;
    
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      console.error("Failed to fetch advertisements: status", response.status);
      return { data: [], success: false } as IAdvertisementResponse;
    }
    const json = await response.json();
    if (!json || typeof json !== "object" || !Array.isArray(json.data)) {
      console.error("Unexpected advertisements payload", json);
      return { data: [], success: false } as IAdvertisementResponse;
    }
    return json as IAdvertisementResponse;
  } catch (error) {
    console.error("Failed to fetch advertisements:", error);
    return { data: [], success: false } as IAdvertisementResponse;
  }
};

export const AdvertisementConnectedCard = () => {
  const { idStore } = usePadConnection();
  const [advertisements, setAdvertisements] = useState<IAdvertisementResponse>({
    data: [],
    success: false,
  });

  useEffect(() => {
    if (!idStore) return;
    getAdvertisements(idStore).then((data) => {
      setAdvertisements(data);
    });
  }, [idStore]);

  console.log(advertisements.data.filter(
    (ad) => ad.tvNumber === 2
  ));
  return (
    <AdvertisementCard
      advertisements={(advertisements.data ?? []).filter(
        (ad) => ad.tvNumber === 2
      )}
      className="w-full h-full col-span-3 object-cover"
    />
  );
};
