'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Clock, Palette, FileText, Edit, Trash2, Loader2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
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

interface EventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
}

export default function EventDetailsModal({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete
}: EventDetailsModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEdit = () => {
    onEdit(event);
    onOpenChange(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(event.id);
      onOpenChange(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getEventDuration = () => {
    if (!event.start) return '';

    if (event.allDay) {
      if (event.end && event.end !== event.start) {
        return `${formatDate(event.start)} - ${formatDate(event.end)}`;
      }
      return formatDate(event.start);
    } else {
      if (event.end) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        if (startDate.toDateString() === endDate.toDateString()) {
          // Same day
          return `${formatDate(event.start)} from ${formatTime(event.start)} to ${formatTime(event.end)}`;
        } else {
          // Different days
          return `${formatDateTime(event.start)} - ${formatDateTime(event.end)}`;
        }
      }
      return formatDateTime(event.start);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--primary-color)] flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: event.backgroundColor || '#3b82f6' }}
            />
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[var(--secondary-color)] mt-0.5" />
            <div>
              <p className="font-medium text-[var(--primary-color)]">
                {event.allDay ? 'All Day' : 'Scheduled'}
              </p>
              <p className="text-[var(--secondary-color)] text-sm">
                {getEventDuration()}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.extendedProps?.description && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[var(--secondary-color)] mt-0.5" />
              <div>
                <p className="font-medium text-[var(--primary-color)]">Description</p>
                <p className="text-[var(--secondary-color)] text-sm whitespace-pre-wrap">
                  {event.extendedProps.description}
                </p>
              </div>
            </div>
          )}

          {/* Color */}
          <div className="flex items-start gap-3">
            <Palette className="w-5 h-5 text-[var(--secondary-color)] mt-0.5" />
            <div>
              <p className="font-medium text-[var(--primary-color)]">Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded-md border border-gray-300"
                  style={{ backgroundColor: event.backgroundColor || '#3b82f6' }}
                />
                <span className="text-[var(--secondary-color)] text-sm">
                  {event.backgroundColor || '#3b82f6'}
                </span>
              </div>
            </div>
          </div>

          {/* Created/Updated Info */}
          {event.extendedProps?.created_at && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[var(--secondary-color)] mt-0.5" />
              <div>
                <p className="font-medium text-[var(--primary-color)]">Created</p>
                <p className="text-[var(--secondary-color)] text-sm">
                  {(() => {
                    const createdAt = event.extendedProps.created_at;
                    if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
                      return createdAt.toDate().toLocaleString();
                    } else if (createdAt) {
                      return new Date(createdAt as string | Date).toLocaleString();
                    }
                    return 'Unknown';
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>

        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={deleting}
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete Event
              </button>
            </div>
          </div>
        ) : (
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--glide-blue)] rounded-md hover:bg-[var(--blue-accent-hover)] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
