import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * Internal tool: there's no marketing page. Signed-in users go to the
 * library, everyone else to the sign-in form.
 */
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
