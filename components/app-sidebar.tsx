"use client"

import { Mail, LogOut, Upload, History, PanelLeft, Settings, Info, ArrowLeftRight, Search, MailPlus, CheckSquare, ChartColumn } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

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
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const source = searchParams.get("source")
  const router = useRouter()
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Determine active state
  const isAnalyzeActive = pathname.startsWith("/analyze") || (pathname.startsWith("/analysis/") && source === "analyze")
  const isHistoryActive = pathname.startsWith("/history") || (pathname.startsWith("/analysis/") && source !== "analyze")

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border bg-[#FDFDFD]">
      <SidebarHeader className="h-[60px] flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex w-full items-center justify-between">
          {!isCollapsed && (
            <div className="relative h-10 w-32">
              <Image src="/neatly-logo-app.png" alt="Neatly" fill className="object-contain object-left" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-black/5 hover:text-foreground"
          >
            <PanelLeft className="h-[22px] w-[22px]" />
            <span className="sr-only">Toggle Sidebar</span>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu className="gap-1">
          {!isCollapsed && (
            <div className="px-2 py-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/70">
              Menu
            </div>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isAnalyzeActive}
              tooltip="Analyze"
              className="h-9 px-2 text-[0.9rem] font-normal text-foreground/80 hover:bg-black/5 hover:text-foreground data-[active=true]:bg-[#E8F0FE] data-[active=true]:font-medium data-[active=true]:text-[#1a73e8]"
            >
              <Link href="/analyze">
                <MailPlus className="size-[18px]" />
                <span>Analyze</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isHistoryActive}
              tooltip="History"
              className="h-9 px-2 text-[0.9rem] font-normal text-foreground/80 hover:bg-black/5 hover:text-foreground data-[active=true]:bg-[#E8F0FE] data-[active=true]:font-medium data-[active=true]:text-[#1a73e8]"
            >
              <Link href="/history">
                <History className="size-[18px]" />
                <span>History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/todos")}
              tooltip="To Do"
              className="h-9 px-2 text-[0.9rem] font-normal text-foreground/80 hover:bg-black/5 hover:text-foreground data-[active=true]:bg-[#E8F0FE] data-[active=true]:font-medium data-[active=true]:text-[#1a73e8]"
            >
              <Link href="/todos">
                <CheckSquare className="size-[18px]" />
                <span>To Do</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 gap-1">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="h-9 px-2 text-[0.9rem] font-normal text-foreground/80 hover:bg-black/5 hover:text-foreground"
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
