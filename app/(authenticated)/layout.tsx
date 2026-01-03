import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <Suspense>
                <AppSidebar />
            </Suspense>
            <SidebarInset className="bg-background h-screen">
                <div className="flex flex-1 flex-col h-full overflow-hidden">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
