"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
    Search,
    Filter,
    ArrowUpDown,
    Calendar,
    ExternalLink,
    MoreHorizontal,
    CheckCircle2,
    AlertCircle,
    ListTodo
} from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import type { Todo } from "@/lib/types"

interface TodoListProps {
    todos: Todo[]
}

type SortOption = "newest" | "oldest" | "priority" | "due_date"
type PriorityFilter = "all" | "high" | "medium" | "low"
type StatusFilter = "outstanding" | "completed" | "all"

export function TodoList({ todos: initialTodos }: TodoListProps) {
    const [todos, setTodos] = useState(initialTodos)
    const [search, setSearch] = useState("")
    const [sort, setSort] = useState<SortOption>("newest")
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("outstanding")
    const [completingId, setCompletingId] = useState<string | null>(null)

    const handleComplete = async (todoId: string, currentStatus: boolean) => {
        setCompletingId(todoId)
        try {
            const newStatus = !currentStatus
            const response = await fetch(`/api/todos/${todoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: newStatus }),
            })

            if (!response.ok) {
                throw new Error("Failed to update todo")
            }

            setTodos(todos.map((t) => (t.id === todoId ? { ...t, completed: newStatus } : t)))
        } catch (error) {
            console.error("Error updating todo:", error)
        } finally {
            setCompletingId(null)
        }
    }

    const filteredAndSortedTodos = useMemo(() => {
        let result = [...todos]

        // Search
        if (search) {
            const searchLower = search.toLowerCase()
            result = result.filter(
                (t) =>
                    t.description.toLowerCase().includes(searchLower) ||
                    t.thread_title?.toLowerCase().includes(searchLower) ||
                    t.assignee?.toLowerCase().includes(searchLower)
            )
        }

        // Status Filter
        if (statusFilter === "outstanding") {
            result = result.filter((t) => !t.completed)
        } else if (statusFilter === "completed") {
            result = result.filter((t) => t.completed)
        }

        // Priority Filter
        if (priorityFilter !== "all") {
            result = result.filter((t) => t.priority === priorityFilter)
        }

        // Sort
        result.sort((a, b) => {
            switch (sort) {
                case "newest":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                case "oldest":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case "priority":
                    const priorityWeight = { high: 3, medium: 2, low: 1 }
                    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
                case "due_date":
                    if (!a.due_date) return 1
                    if (!b.due_date) return -1
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                default:
                    return 0
            }
        })

        return result
    }, [todos, search, sort, priorityFilter, statusFilter])

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high":
                return <Badge variant="destructive">High</Badge>
            case "medium":
                return <Badge variant="default">Medium</Badge>
            case "low":
                return <Badge variant="secondary">Low</Badge>
            default:
                return <Badge variant="outline">{priority}</Badge>
        }
    }

    const isOverdue = (dateStr?: string | null, completed?: boolean) => {
        if (!dateStr || completed) return false
        return new Date(dateStr) < new Date()
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-1">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-xl">
                                <ListTodo className="mr-2 h-4 w-4" />
                                Status
                                <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal capitalize">
                                    {statusFilter}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <DropdownMenuRadioItem value="outstanding">Outstanding</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="all">All Tasks</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-xl">
                                <Filter className="mr-2 h-4 w-4" />
                                Priority
                                {priorityFilter !== "all" && (
                                    <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal capitalize">
                                        {priorityFilter}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
                                <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-xl">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                                <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="due_date">Due Date</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>


                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table className="[&_tr:last-child]:border-b">
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="min-w-[300px]">Task</TableHead>
                                <TableHead className="w-[150px]">Priority</TableHead>
                                <TableHead className="w-[200px]">Thread</TableHead>
                                <TableHead className="w-[150px]">Due Date</TableHead>
                                <TableHead className="w-[150px]">Assignee</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedTodos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No tasks found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedTodos.map((todo) => (
                                    <TableRow key={todo.id} className={todo.completed ? "opacity-50 bg-muted/50" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={todo.completed}
                                                onCheckedChange={() => handleComplete(todo.id, todo.completed)}
                                                disabled={completingId === todo.id}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                                                    {todo.description}
                                                </span>
                                                {isOverdue(todo.due_date, todo.completed) && (
                                                    <span className="text-xs text-destructive flex items-center mt-1">
                                                        <AlertCircle className="h-3 w-3 mr-1" /> Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(todo.priority)}</TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/analysis/${todo.thread_id}`}
                                                className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                                <span className="truncate max-w-[180px]">{todo.thread_title || "View Thread"}</span>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {todo.due_date ? (
                                                <div className="flex items-center text-muted-foreground">
                                                    <Calendar className="mr-2 h-3 w-3" />
                                                    {format(new Date(todo.due_date), "MMM d, yyyy")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {todo.assignee ? (
                                                <span className="text-sm text-muted-foreground">{todo.assignee}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleComplete(todo.id, todo.completed)}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        {todo.completed ? "Mark as Incomplete" : "Mark as Complete"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/analysis/${todo.thread_id}`}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            View Analysis
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
