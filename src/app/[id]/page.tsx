import {
  AdvertisementFullscreen,
  IAdvertisementResponse,
} from "@widgets/advertisement";

export const dynamic = "force-dynamic";

const getAdvertisements = async (id: string): Promise<IAdvertisementResponse> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "https://statosphera.ru/api/foodcord";
    const url = `${baseUrl}/banner-tv/get-all-store-bunner-tv/${id}`;
    
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
export default async function Home({ params }: { params: { id: string } }) {
  const { id } = await params;

  const advertisements = await getAdvertisements(id);
  console.log(advertisements.data, "all ads");
  console.log(
    (advertisements.data ?? []).filter((ad) => ad.tvNumber === 1),
    "tv1 filtered ads"
  );
  return (
    <div className="min-h-screen w-full">
      <AdvertisementFullscreen
        advertisements={(advertisements.data ?? []).filter(
          (ad) => ad.tvNumber === 1
        )}
      />
    </div>
  );
}


