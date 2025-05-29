'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface CalendarProps {
  className?: string;
}

export default function Calendar({ className = '' }: CalendarProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Load events when component mounts or user changes
  useEffect(() => {
    if (user?.uid) {
      loadEvents();

      // Subscribe to real-time updates
      const unsubscribe = eventService.subscribeToUserEvents(
        user.uid,
        (updatedEvents, error) => {
          if (error) {
            console.error('Error in events subscription:', error);
            if (error.code === 'permission-denied') {
              setError('Permission denied. Please set up Firestore security rules for calendar_events collection.');
            } else {
              setError('Failed to load events: ' + error.message);
            }
          } else {
            const formattedEvents = updatedEvents.map(event =>
              eventService.formatEventForCalendar(event)
            );
            setEvents(formattedEvents);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');
      const userEvents = await eventService.getUserEvents(user.uid);
      const formattedEvents = userEvents.map(event =>
        eventService.formatEventForCalendar(event)
      );
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      if (error.message.includes('Permission denied')) {
        setError('Permission denied. Please set up Firestore security rules for calendar_events collection.');
      } else {
        setError('Failed to load events: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: any) => {
    if (!user) {
      alert('Please log in to create events');
      return;
    }

    setSelectedDate(arg.dateStr);
    setSelectedEvent(null);
    setModalMode('create');
    setEventModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setEventDetailsModalOpen(true);
  };

  const handleCreateEvent = async (eventData: any) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      await eventService.createEvent(eventData, user.uid);
      // Events will be updated via real-time subscription
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setModalMode('edit');
    setEventModalOpen(true);
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!user?.uid || !selectedEvent?.id) {
      throw new Error('User not authenticated or event not selected');
    }

    try {
      await eventService.updateEvent(selectedEvent.id, eventData, user.uid);
      // Events will be updated via real-time subscription
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      await eventService.deleteEvent(eventId, user.uid);
      // Events will be updated via real-time subscription
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const handleEventSave = async (eventData: any) => {
    if (modalMode === 'create') {
      await handleCreateEvent(eventData);
    } else {
      await handleUpdateEvent(eventData);
    }
  };

  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div className={`calendar-container ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500">Please log in to view and manage your calendar events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`calendar-container ${className}`}>
      {/* Header with Create Event Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-[var(--glide-blue)]" />}
          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedDate('');
            setSelectedEvent(null);
            setModalMode('create');
            setEventModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--glide-blue)] rounded-md hover:bg-[var(--blue-accent-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Custom CSS for FullCalendar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .calendar-container .fc {
            font-family: inherit;
          }

          .calendar-container .fc-toolbar {
            margin-bottom: 1.5rem;
          }

          .calendar-container .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--primary-color, #1f2937);
          }

          .calendar-container .fc-button {
            background-color: var(--primary-color, #3b82f6) !important;
            border-color: var(--primary-color, #3b82f6) !important;
            color: white !important;
            border-radius: 0.375rem;
            padding: 0.5rem 1rem;
            font-weight: 500;
            transition: all 0.2s;
          }

          .calendar-container .fc-button:hover {
            background-color: var(--primary-hover, #2563eb) !important;
            border-color: var(--primary-hover, #2563eb) !important;
          }

          .calendar-container .fc-button:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .calendar-container .fc-button-active {
            background-color: var(--primary-hover, #2563eb) !important;
            border-color: var(--primary-hover, #2563eb) !important;
          }

          .calendar-container .fc-daygrid-day {
            background-color: white;
          }

          .calendar-container .fc-daygrid-day:hover {
            background-color: #f8fafc;
          }

          .calendar-container .fc-day-today {
            background-color: #eff6ff !important;
          }

          .calendar-container .fc-event {
            border-radius: 0.25rem;
            padding: 2px 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .calendar-container .fc-event:hover {
            opacity: 0.8;
            transform: translateY(-1px);
          }

          .calendar-container .fc-daygrid-event {
            margin: 1px 2px;
          }

          .calendar-container .fc-col-header-cell {
            background-color: #f8fafc;
            font-weight: 600;
            color: var(--secondary-color, #6b7280);
            padding: 0.75rem 0;
          }

          .calendar-container .fc-scrollgrid {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
          }

          .calendar-container .fc-scrollgrid-section > * {
            border-color: #e5e7eb;
          }

          .calendar-container .fc-daygrid-day-number {
            color: var(--text-color, #374151);
            font-weight: 500;
            padding: 0.5rem;
          }

          .calendar-container .fc-day-other .fc-daygrid-day-number {
            color: #9ca3af;
          }
        `
      }} />

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        aspectRatio={1.8}
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventDisplay="block"
        displayEventTime={true}
        allDaySlot={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        expandRows={true}
        stickyHeaderDates={true}
        nowIndicator={true}
        selectable={true}
        selectMirror={true}
        dayPopoverFormat={{ month: 'long', day: 'numeric', year: 'numeric' }}
      />

      {/* Event Creation/Edit Modal */}
      <EventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        onSave={handleEventSave}
        initialData={selectedEvent}
        selectedDate={selectedDate}
        mode={modalMode}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        open={eventDetailsModalOpen}
        onOpenChange={setEventDetailsModalOpen}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
