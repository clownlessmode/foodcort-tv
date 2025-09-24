import {
  AdvertisementCard,
  IAdvertisementResponse,
} from "@widgets/advertisement";
import { Orders } from "@widgets/orders";

const getAdvertisements = async (): Promise<IAdvertisementResponse> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/banner-tv`,
      { credentials: "include" }
    );
    console.log(response.json());
    return response.json();
  } catch (error) {
    console.error("Failed to fetch advertisements:", error);
    return { data: [], success: false } as IAdvertisementResponse;
  }
};
export default async function Home() {
  const advertisements = await getAdvertisements();
  return (
    <div className="grid grid-cols-5 min-h-screen">
      <Orders />
      <AdvertisementCard
        advertisements={(advertisements.data ?? []).filter(
          (ad) => ad.tvNumber === 1
        )}
        className="w-full h-full col-span-3 object-cover "
      />
    </div>
  );
}
