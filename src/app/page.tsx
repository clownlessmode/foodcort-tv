import { Orders } from "@widgets/orders";
import { AdvertisementConnectedCard } from "@widgets/advertisement/ui/advertisement-connected-card";
import { TvLayout } from "@widgets/tv-layout";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <TvLayout>
      <div className="grid grid-cols-5 min-h-screen">
        <Orders />
        <AdvertisementConnectedCard />
      </div>
    </TvLayout>
  );
}
