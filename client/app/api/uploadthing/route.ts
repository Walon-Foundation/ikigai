import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Serves the UploadThing upload/callback endpoints. Reads UPLOADTHING_TOKEN
// from the environment automatically.
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
