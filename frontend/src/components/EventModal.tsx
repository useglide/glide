'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Clock, Palette, FileText, Loader2 } from 'lucide-react';

interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  extendedProps?: {
    description?: string;
    created_at?: Date | { toDate(): Date } | string;
    updated_at?: Date | { toDate(): Date } | string;
  };
}

interface EventData {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  description?: string;
  color?: string;
}

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventData: EventData) => Promise<void>;
  initialData?: CalendarEvent;
  selectedDate?: string;
  mode: 'create' | 'edit';
}

const colorOptions = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
];

export default function EventModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  selectedDate,
  mode
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [allDay, setAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with data
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.extendedProps?.description || '');
        setColor(initialData.backgroundColor || '#3b82f6');

        if (initialData.start) {
          const startDateTime = new Date(initialData.start);
          setStartDate(startDateTime.toISOString().split('T')[0]);
          if (!initialData.allDay) {
            setStartTime(startDateTime.toTimeString().slice(0, 5));
          }
        }

        if (initialData.end) {
          const endDateTime = new Date(initialData.end);
          setEndDate(endDateTime.toISOString().split('T')[0]);
          if (!initialData.allDay) {
            setEndTime(endDateTime.toTimeString().slice(0, 5));
          }
        }

        setAllDay(initialData.allDay || false);
      } else if (mode === 'create') {
        // Reset form for new event
        setTitle('');
        setDescription('');
        setColor('#3b82f6');
        setAllDay(false);

        if (selectedDate) {
          setStartDate(selectedDate);
          setEndDate(selectedDate);
        } else {
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          setEndDate(today);
        }

        setStartTime('09:00');
        setEndTime('10:00');
      }
      setError('');
    }
  }, [open, mode, initialData, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!title.trim()) {
        throw new Error('Event title is required');
      }

      if (!startDate) {
        throw new Error('Start date is required');
      }

      // Create event data
      const eventData: Partial<EventData> = {
        title: title.trim(),
        description: description.trim(),
        color
      };

      // Handle dates and times
      if (allDay) {
        eventData.start = startDate;
        if (endDate && endDate !== startDate) {
          eventData.end = endDate;
        }
        eventData.allDay = true;
      } else {
        // Combine date and time
        const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
        eventData.start = startDateTime.toISOString();

        if (endDate && endTime) {
          const endDateTime = new Date(`${endDate}T${endTime}`);
          if (endDateTime <= startDateTime) {
            throw new Error('End time must be after start time');
          }
          eventData.end = endDateTime.toISOString();
        }
      }

      await onSave(eventData as EventData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--primary-color)]">
            {mode === 'create' ? 'Create New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
              placeholder="Enter event title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
              placeholder="Enter event description..."
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-gray-300 text-[var(--glide-blue)] focus:ring-[var(--glide-blue)]"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-[var(--secondary-color)]">
              All day event
            </label>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              <Palette className="inline w-4 h-4 mr-1" />
              Event Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`w-full h-10 rounded-md border-2 transition-all ${
                    color === colorOption.value
                      ? 'border-gray-800 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--secondary-color)] bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--glide-blue)] rounded-md hover:bg-[var(--blue-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'create' ? 'Create Event' : 'Save Changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
