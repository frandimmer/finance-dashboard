import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";

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

      <main className="flex min-h-screen flex-1 flex-col bg-gray-50 text-gray-950 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-50">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950">
          <SidebarTrigger className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100" />

          <ThemeToggle />
        </div>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
