"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    MailPlus,
    FileText,
    CheckSquare,
    ArrowRight,
    Calendar,
    ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import type { EmailThread, Todo } from "@/lib/types"

interface DashboardStats {
    totalAnalyses: number
    pendingTodos: number
    upcomingEvents: number
}

interface HomeDashboardProps {
    stats: DashboardStats
    recentAnalyses: EmailThread[]
    pendingTodos: Todo[]
}

export function HomeDashboard({
    stats,
    recentAnalyses,
    pendingTodos
}: HomeDashboardProps) {
    return (
        <div className="h-full flex flex-col overflow-auto space-y-6">
            {/* Page Header with New Analysis CTA */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                    <p className="text-muted-foreground">Here's what's happening with your analyses</p>
                </div>
                <Link href="/new">
                    <Button size="lg" className="gap-2">
                        <MailPlus className="h-4 w-4" />
                        New Analysis
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/analysis">
                    <Card className="bg-gradient-to-br from-blue-500/5 via-transparent to-transparent hover:bg-muted/50 transition-colors cursor-pointer h-full group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                            <div className="h-4 w-4 relative">
                                <FileText className="h-4 w-4 text-muted-foreground absolute top-0 right-0 transition-all group-hover:opacity-0 group-hover:scale-75" />
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground absolute top-0 right-0 opacity-0 scale-75 transition-all group-hover:opacity-100 group-hover:scale-100" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
                            <p className="text-xs text-muted-foreground">Email threads analyzed</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/todos">
                    <Card className="bg-gradient-to-br from-violet-500/5 via-transparent to-transparent hover:bg-muted/50 transition-colors cursor-pointer h-full group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending To-Dos</CardTitle>
                            <div className="h-4 w-4 relative">
                                <CheckSquare className="h-4 w-4 text-muted-foreground absolute top-0 right-0 transition-all group-hover:opacity-0 group-hover:scale-75" />
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground absolute top-0 right-0 opacity-0 scale-75 transition-all group-hover:opacity-100 group-hover:scale-100" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingTodos}</div>
                            <p className="text-xs text-muted-foreground">Tasks to complete</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/calendar">
                    <Card className="bg-gradient-to-br from-amber-500/5 via-transparent to-transparent hover:bg-muted/50 transition-colors cursor-pointer h-full group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                            <div className="h-4 w-4 relative">
                                <Calendar className="h-4 w-4 text-muted-foreground absolute top-0 right-0 transition-all group-hover:opacity-0 group-hover:scale-75" />
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground absolute top-0 right-0 opacity-0 scale-75 transition-all group-hover:opacity-100 group-hover:scale-100" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                            <p className="text-xs text-muted-foreground">In the next 7 days</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0">
                {/* Recent Analyses */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Analyses</CardTitle>
                            <CardDescription>Your latest email thread analyses</CardDescription>
                        </div>
                        <Link href="/analysis">
                            <Button variant="ghost" size="sm" className="gap-1">
                                View all <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {recentAnalyses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-6">
                                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No analyses yet</p>
                                <Link href="/new" className="mt-2">
                                    <Button variant="link" size="sm">Start your first analysis</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentAnalyses.map((thread) => (
                                    <Link
                                        key={thread.id}
                                        href={`/analysis/${thread.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{thread.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(thread.created_at).toLocaleDateString("en-US")}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending To-Dos */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pending To-Dos</CardTitle>
                            <CardDescription>High priority tasks to complete</CardDescription>
                        </div>
                        <Link href="/todos">
                            <Button variant="ghost" size="sm" className="gap-1">
                                View all <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {pendingTodos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-6">
                                <CheckSquare className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No pending to-dos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingTodos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{todo.description}</p>
                                            {todo.thread_title && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    From: {todo.thread_title}
                                                </p>
                                            )}
                                        </div>
                                        {todo.priority === "high" && (
                                            <Badge variant="destructive" className="flex-shrink-0">High</Badge>
                                        )}
                                        {todo.priority === "medium" && (
                                            <Badge variant="default" className="flex-shrink-0">Medium</Badge>
                                        )}
                                        {todo.priority === "low" && (
                                            <Badge variant="secondary" className="flex-shrink-0">Low</Badge>
                                        )}
                                        {!["high", "medium", "low"].includes(todo.priority) && (
                                            <Badge variant="outline" className="flex-shrink-0">{todo.priority}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
