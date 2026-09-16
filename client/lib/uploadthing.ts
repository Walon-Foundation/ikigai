import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Client-side hook for direct-to-UploadThing uploads. We use the headless hook
// (not the prebuilt button) so the upload UI matches the app's design system
// and needs no extra UploadThing stylesheet.
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
