import { redirect } from "next/navigation";

// The CMS landing lands on Programmes — the section an editor reaches for most.
export default function CmsIndex() {
  redirect("/admin/cms/programmes");
}
