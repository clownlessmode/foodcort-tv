import { AdvertisementConnectedFullscreen } from "@widgets/advertisement/ui/advertisement-connected-fullscreen";
import { TvLayout } from "@widgets/tv-layout";

export const dynamic = "force-dynamic";

export default async function TV2Page() {
  return (
    <TvLayout>
      <div className="min-h-screen w-full">
        <AdvertisementConnectedFullscreen />
      </div>
    </TvLayout>
  );
}
