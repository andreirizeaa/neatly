import EventCalendarApp from "./components/event-calendar-app"

export default function CalendarPage() {
    return (
        <div className="flex h-full flex-col gap-4 p-4 overflow-hidden">
            <div>
                <h1 className="text-3xl font-bold mb-2">Calendar</h1>
                <p className="text-muted-foreground">View and manage your schedule</p>
            </div>
            <div className="flex-1 min-h-0">
                <EventCalendarApp />
            </div>
        </div>
    )
}
