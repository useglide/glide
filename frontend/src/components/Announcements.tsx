'use client';

import React from 'react';
import { FlagIcon } from 'lucide-react';

// Define the announcement interface
interface Announcement {
  id: number;
  title: string;
  message?: string;
  html?: string;
  posted_at?: string;
  delayed_post_at?: string;
  context_code?: string;
  course_id?: number;
  context_name?: string;
}

interface AnnouncementsProps {
  announcements: Announcement[];
  loading: boolean;
}

export function Announcements({
  announcements = [],
  loading = false
}: AnnouncementsProps) {
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {/* Show 3 skeleton items */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 bg-gray-200 rounded mr-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Use the real announcements data
  const announcementsToDisplay = announcements;

  // Empty state
  const hasNoAnnouncements = announcementsToDisplay.length === 0;

  return (
    <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg mb-10">
      <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-6">Announcements</h2>

      {hasNoAnnouncements ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
          <p className="text-gray-500 mb-6">You don&apos;t have any announcements at the moment.</p>
        </div>
      ) : (
        <div className="mb-6">
          {/* Announcement items */}
          {announcementsToDisplay.map((announcement: Announcement, index: number) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
              isLast={index === announcementsToDisplay.length - 1}
            />
          ))}
        </div>
      )}

      {/* View All Announcements button */}
      <div className="pt-4">
        <button
          type="button"
          className="w-full flex items-center justify-center py-3 px-4 bg-[var(--glide-blue-10)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer font-bold"
          onClick={() => window.location.href = '/announcements'}
        >
          View All Announcements
        </button>
      </div>
    </div>
  );
}

// Announcement Item Component
function AnnouncementItem({ announcement, isLast = false }: { announcement: Announcement; isLast?: boolean }) {
  // Extract course name from context_name or context_code
  const courseName = announcement.context_name ||
    (announcement.context_code ?
      announcement.context_code.replace('course_', 'Course ') :
      'Unknown Course');

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      // If it's today, show only time
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // If it's yesterday, show "Yesterday"
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // Otherwise show date
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const postedDate = formatDate(announcement.posted_at);

  return (
    <div className={`flex items-start justify-between py-6 px-4 hover:bg-opacity-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <div className="flex items-start">
        <div className="w-10 h-10 bg-[var(--glide-blue-20)] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
          <FlagIcon className="h-5 w-5 text-[var(--glide-blue)]" />
        </div>
        <div>
          <h3 className="font-medium text-[var(--primary-color)]">{announcement.title}</h3>
          <p className="text-sm text-[var(--secondary-color)]">{courseName}</p>
          <div className="text-[var(--secondary-color)] mt-2 text-sm">
            {announcement.html ? (
              <div
                className="announcement-content"
                dangerouslySetInnerHTML={{ __html: announcement.html }}
              />
            ) : announcement.message ? (
              <div
                className="announcement-content"
                dangerouslySetInnerHTML={{ __html: announcement.message }}
              />
            ) : (
              <p>No content available</p>
            )}
          </div>
        </div>
      </div>
      {postedDate && (
        <div className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--text-secondary)] text-white whitespace-nowrap">
          {postedDate}
        </div>
      )}
    </div>
  );
}
