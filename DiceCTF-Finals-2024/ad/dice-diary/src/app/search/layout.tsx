import util from "@/util";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await util.getUser();
  if (!user) {
    return redirect("/login?message=please login first");
  }
  return children;
}
