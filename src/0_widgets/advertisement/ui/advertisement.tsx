import {
  AdvertisementCard,
  IAdvertisementResponse,
} from "@widgets/advertisement";

const getAdvertisements = async (): Promise<IAdvertisementResponse> => {
  try {
    const baseUrl =
      `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/api/foodcord` ||
      "https://statosphera.ru/api/foodcord";
    const url = `${baseUrl}/banner-tv/get-all-store-bunner-tv/42014`;
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

export const Advertisement = async () => {
  const advertisements = await getAdvertisements();
  console.log(advertisements.data, "all ads");
  console.log(
    (advertisements.data ?? []).filter((ad) => ad.tvNumber === 1),
    "tv1 filtered ads"
  );

  return (
    <AdvertisementCard
      advertisements={(advertisements.data ?? []).filter(
        (ad) => ad.tvNumber === 2
      )}
      className="w-full h-full col-span-3 object-cover"
    />
  );
};
