import {
  AdvertisementFullscreen,
  IAdvertisementResponse,
} from "@widgets/advertisement";

const getAdvertisements = async (): Promise<IAdvertisementResponse> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/banner-tv`,
      { credentials: "include" }
    );

    return response.json();
  } catch (error) {
    console.error("Failed to fetch advertisements:", error);
    return { data: [], success: false } as IAdvertisementResponse;
  }
};

export default async function TV2Page() {
  const advertisements = await getAdvertisements();

  return (
    <div className="min-h-screen w-full">
      <AdvertisementFullscreen
        advertisements={(advertisements.data ?? []).filter(
          (ad) => ad.tvNumber === 2
        )}
      />
    </div>
  );
}
