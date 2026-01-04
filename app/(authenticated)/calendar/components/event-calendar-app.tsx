"use client";

import { useState, useEffect } from "react";

import { EventCalendar, type CalendarEvent } from "./";

export default function EventCalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/calendar-events");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();

      // Transform API response to CalendarEvent format
      const transformedEvents: CalendarEvent[] = data.events.map((event: {
        id: string;
        title: string;
        description?: string;
        start_time: string;
        end_time: string;
        all_day?: boolean;
        color?: string;
        location?: string;
        analysis_id?: string;
        thread_id?: string;
        source_type?: string;
        source_evidence?: string;
      }) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        allDay: event.all_day,
        color: event.color as CalendarEvent['color'],
        location: event.location,
        analysisId: event.analysis_id,
        threadId: event.thread_id,
        sourceType: event.source_type as 'deadline' | 'manual',
        sourceEvidence: event.source_evidence,
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAdd = async (event: CalendarEvent) => {
    try {
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          startTime: event.start.toISOString(),
          endTime: event.end.toISOString(),
          allDay: event.allDay,
          color: event.color,
          location: event.location,
          sourceType: "manual",
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");
      const data = await response.json();

      // Add the new event with the server-generated ID
      setEvents([...events, {
        ...event,
        id: data.event.id,
      }]);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      const response = await fetch(`/api/calendar-events/${updatedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedEvent.title,
          description: updatedEvent.description,
          startTime: updatedEvent.start.toISOString(),
          endTime: updatedEvent.end.toISOString(),
          allDay: updatedEvent.allDay,
          color: updatedEvent.color,
          location: updatedEvent.location,
        }),
      });

      if (!response.ok) throw new Error("Failed to update event");

      setEvents(events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      setEvents(events.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <EventCalendar
      events={events}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
    />
  );
}
