"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
    className?: string
    height?: number
    width?: number
}

export function BrandLogo({ className, height = 40, width = 120 }: BrandLogoProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={cn("relative", className)} style={{ height, width }} />
    }

    return (
        <div className={cn("relative", className)} style={{ height, width }}>
            <Image
                src={theme === "dark" ? "/neatly-logo-app-dark.png" : "/neatly-logo-app.png"}
                alt="Neatly"
                fill
                className="object-contain object-left"
                priority
            />
        </div>
    )
}
