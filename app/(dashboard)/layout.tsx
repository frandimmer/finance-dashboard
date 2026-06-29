import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { prisma } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      name: true,
      email: true,
      image: true,
      preferredCurrency: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <main className="flex-1 flex flex-col min-h-screen bg-gray-50">
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-white">
          <SidebarTrigger className="text-gray-400 hover:text-gray-700" />
        </div>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}