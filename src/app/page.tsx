import { Orders } from "@widgets/orders";
import { ConnectionWrapper } from "@widgets/pad-connection/ui/connection-wrapper";
import { PadConnection } from "@widgets/pad-connection/ui/pad-connection";
import { AdvertisementConnectedCard } from "@widgets/advertisement/ui/advertisement-connected-card";

export const dynamic = "force-dynamic";

export default async function Home() {

  return (
    <ConnectionWrapper fallback={<PadConnection />}>
      <div className="grid grid-cols-5 min-h-screen">
        <Orders />
        <AdvertisementConnectedCard />
      </div>
    </ConnectionWrapper>
  );
}
