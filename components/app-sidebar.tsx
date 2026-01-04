"use client"

import { Mail, LogOut, Upload, History, PanelLeft, Settings, Info, ArrowLeftRight, Search, MailPlus, CheckSquare, ChartColumn, Moon, Sun, Calendar, Monitor, ChevronUp } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const source = searchParams.get("source")
  const router = useRouter()
  const { toggleSidebar, state } = useSidebar()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isCollapsed = state === "collapsed"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine active state
  const isNewThreadActive = pathname.startsWith("/new")
  const isAnalysisActive = pathname.startsWith("/analysis")

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border bg-sidebar dark:bg-[#111827]">
      <SidebarHeader className="h-[60px] flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex w-full items-center justify-between">
          {!isCollapsed && (
            <div className="relative h-10 w-32">
              <Image src={mounted && resolvedTheme === "dark" ? "/neatly-logo-app-dark.png" : "/neatly-logo-app.png"} alt="Neatly" fill className="object-contain object-left" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelLeft className="h-[22px] w-[22px]" />
            <span className="sr-only">Toggle Sidebar</span>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu className="gap-1">
          {!isCollapsed && (
            <div className="px-2 py-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-sidebar-foreground/60">
              Menu
            </div>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isNewThreadActive}
              tooltip="New Thread"
              className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary"
            >
              <Link href="/new">
                <MailPlus className="size-[18px]" />
                <span>New Thread</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/calendar")}
              tooltip="Calendar"
              className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary"
            >
              <Link href="/calendar">
                <Calendar className="size-[18px]" />
                <span>Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/todos")}
              tooltip="To Do"
              className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary"
            >
              <Link href="/todos">
                <CheckSquare className="size-[18px]" />
                <span>To Do</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isAnalysisActive}
              tooltip="Analysis"
              className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary"
            >
              <Link href="/analysis">
                <History className="size-[18px]" />
                <span>Analysis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 gap-1">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Theme"
                  className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Sun className="size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>
                    {mounted ? (theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System") : "Theme"}
                  </span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                  <Sun className="size-4" />
                  <span>Light</span>
                  {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                  <Moon className="size-4" />
                  <span>Dark</span>
                  {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                  <Monitor className="size-4" />
                  <span>System</span>
                  {theme === "system" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="h-9 px-2 text-[0.9rem] font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-[18px]" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
