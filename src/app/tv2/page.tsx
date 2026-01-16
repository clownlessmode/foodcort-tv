import { AdvertisementConnectedFullscreen } from "@widgets/advertisement/ui/advertisement-connected-fullscreen";
import { ConnectionWrapper } from "@widgets/pad-connection/ui/connection-wrapper";
import { PadConnection } from "@widgets/pad-connection/ui/pad-connection";

export const dynamic = "force-dynamic";

export default async function TV2Page() {
return (
    <ConnectionWrapper fallback={<PadConnection />}>
      <div className="min-h-screen w-full">
        <AdvertisementConnectedFullscreen />
      </div>
    </ConnectionWrapper>
  );
}
