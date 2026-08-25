import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/db-user";

// Every signed-in role can reach the safety surfaces — deliberately NOT
// requireRole(["mentee"]).
//
// This layout used to gate on the mentee role, which meant requireRole()
// bounced mentors and parents to /dashboard. Two consequences, both bad:
//
//   1. A mentor who noticed something worrying about a mentee had no route to
//      report it, and a parent worried about their child's mentor had none
//      either. The adults closest to a child in trouble were the only people
//      the reporting form was closed to.
//   2. /safety/help is static helpline content — phone numbers, the "you are
//      not alone" page — with no user data on it at all. The journal's "View
//      crisis resources" link points straight at it, so a mentor or parent who
//      clicked it in the middle of a crisis was silently redirected to their
//      dashboard with no explanation and no phone number.
//
// So the boundary here is only "signed in": we still resolve the user (and
// send an anonymous visitor to sign-in) rather than dropping the check
// entirely, because the report form's server action needs an account to
// attribute the report to. Role-specific behaviour, if it is ever needed,
// belongs on the individual page rather than on a shutter across the whole
// module.
//
// KNOWN REMAINING GAP: ./page.tsx (the report form's own page) still calls
// requireRole(["mentee"]) on line ~17, so opening this layout fixes
// /safety/help for every role but /safety itself still bounces mentors and
// parents to /dashboard. That call has to be relaxed to getDbUser() the same
// way for point 1 above to actually hold — until then a mentor with a
// safeguarding concern still has no reporting route.
export default async function SafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  return <>{children}</>;
}
