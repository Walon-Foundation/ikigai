import { redirect } from "next/navigation";

// Merged into Website → Events. Keep the route as a redirect so bookmarks
// and old links don't 404 while the dupe stays removed from the sidebar.
export default function AdminEventsPage() {
  redirect("/admin/cms/events");
}
