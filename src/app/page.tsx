import {
  AdvertisementCard,
  IAdvertisementResponse,
} from "@widgets/advertisement";
import { Orders } from "@widgets/orders";

export const dynamic = "force-dynamic";

const getAdvertisements = async (): Promise<IAdvertisementResponse> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "https://statosphera.ru/api/foodcord";
    const url = `${baseUrl}/banner-tv`;
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
export default async function Home() {
  const advertisements = await getAdvertisements();
  console.log(advertisements.data, "all ads");
  console.log(
    (advertisements.data ?? []).filter((ad) => ad.tvNumber === 1),
    "tv1 filtered ads"
  );
  return (
    <div className="grid grid-cols-5 min-h-screen">
      <Orders />
      <AdvertisementCard
        advertisements={(advertisements.data ?? []).filter(
          (ad) => ad.tvNumber === 2
        )}
        className="w-full h-full col-span-3 object-cover "
      />
    </div>
  );
}
