import { desc } from "drizzle-orm";
import { db } from "@/db/db";
import { mediaAssets } from "@/db/schema";
import { MediaLibrary } from "./media-client";

export default async function MediaCmsPage() {
  const assets = await db
    .select({
      id: mediaAssets.id,
      url: mediaAssets.url,
      label: mediaAssets.label,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(200);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Your image library. Upload photos and logos as they come in, then copy a
        link and paste it into any programme, story, event or partner.
      </p>
      <MediaLibrary assets={assets} />
    </div>
  );
}
