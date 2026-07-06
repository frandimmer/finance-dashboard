import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <main className="flex min-h-screen flex-1 flex-col bg-gray-50">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white p-4">
          <SidebarTrigger className="text-gray-400 hover:text-gray-700" />
        </div>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}