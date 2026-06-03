import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) redirect("/login")

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <main className="flex-1 flex flex-col min-h-screen bg-zinc-950">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <SidebarTrigger className="text-zinc-400 hover:text-white" />
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}