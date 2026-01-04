export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    color?: EventColor;
    location?: string;
    // Source metadata for deadline-sourced events
    analysisId?: string;
    threadId?: string;
    sourceType?: 'deadline' | 'manual';
    sourceEvidence?: string;
}

export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";
