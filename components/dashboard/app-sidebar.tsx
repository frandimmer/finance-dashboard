import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Repeat,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transacciones",
    url: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Presupuestos",
    url: "/dashboard/budgets",
    icon: PiggyBank,
  },
  {
    title: "Recurrentes",
    url: "/dashboard/recurring",
    icon: Repeat,
  },
  {
    title: "Categorías",
    url: "/dashboard/categories",
    icon: Tag,
  },
];

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const fallback = user.name?.[0] ?? user.email?.[0] ?? "U";

  return (
    <Sidebar className="border-r border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <SidebarHeader className="border-b border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/20">
            <span className="text-xs font-bold text-white">F</span>
          </div>

          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Finance Dashboard
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white px-2 py-3 transition-colors duration-200 dark:bg-gray-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton className="h-10 rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[active=true]:bg-gray-100 data-[active=true]:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-100 dark:data-[active=true]:bg-gray-800 dark:data-[active=true]:text-gray-100">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-800">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {fallback.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name ?? "Usuario"}
              </span>
              <span className="truncate text-xs text-gray-500 dark:text-gray-500">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}