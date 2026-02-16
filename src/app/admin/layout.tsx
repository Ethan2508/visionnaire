import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard (defense-in-depth — middleware also checks)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="flex">
        <AdminSidebar />
        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-4 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
