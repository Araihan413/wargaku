import { redirect } from "next/navigation";

export default function DuesParentPage() {
  redirect("/dashboard/dues/manage");
}
