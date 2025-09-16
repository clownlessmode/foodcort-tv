import { AdvertisementCard } from "@widgets/advertisement";
import { Orders } from "@widgets/orders";

const getAdvertisements = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/banner-main`,
      { credentials: "include" }
    );

    return response.json();
  } catch (error) {
    console.error("Failed to fetch advertisements:", error);
    return { data: [], success: false };
  }
};
export default async function Home() {
  const advertisements = await getAdvertisements();
  return (
    <div className="grid grid-cols-5 min-h-screen">
      <Orders />
      <AdvertisementCard
        advertisements={advertisements.data}
        className="w-full h-full col-span-3 object-cover "
      />
    </div>
  );
}
