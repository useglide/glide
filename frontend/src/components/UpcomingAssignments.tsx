'use client';

import React from 'react';
import { FileIcon } from 'lucide-react';

// Define the assignment interface
interface Assignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible?: number | null;
  html_url?: string;
  course_name?: string;
  course_code?: string;
  course_id?: number;
  submission?: {
    submitted_at?: string;
    score?: number;
    grade?: string;
    late?: boolean;
    missing?: boolean;
  };
}

interface UpcomingAssignmentsProps {
  assignments: Assignment[];
  loading: boolean;
}

export function UpcomingAssignments({
  assignments = [],
  loading = false
}: UpcomingAssignmentsProps) {
  // TEST DATA - Delete this section when real data is available and make sure it works
  const testAssignments: Assignment[] = [
    {
      id: 1001,
      name: "C.3 Types of Functions Project",
      due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      course_code: "2025SP Discrete Math(MAT-303)",
      course_id: 101
    },
    {
      id: 1002,
      name: "Linear Algebra Final Exam",
      due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      course_code: "2025SP Linear Algebra(MAT-304)",
      course_id: 102
    },
    {
      id: 1003,
      name: "Programming Assignment #4",
      due_at: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(), // 12 hours from now
      course_code: "2025SP Computer Science(CS-101)",
      course_id: 103
    },
    {
      id: 1004,
      name: "Research Paper Draft",
      due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      course_code: "2025SP English Composition(ENG-201)",
      course_id: 104
    },
    {
      id: 1005,
      name: "Physics Lab Report",
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      course_code: "2025SP Physics(PHY-201)",
      course_id: 105
    },
    {
      id: 1006,
      name: "Group Project Presentation",
      due_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      course_code: "2025SP Business Management(BUS-301)",
      course_id: 106
    }
  ];
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {/* Show 6 skeleton items */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded mr-4"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Use test data if no assignments are provided
  let assignmentsToDisplay = assignments.length > 0 ? assignments : testAssignments;

  // Sort assignments by due date (earliest first)
  assignmentsToDisplay = [...assignmentsToDisplay].sort((a, b) => {
    // Handle null due dates (put them at the end)
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;

    // Compare dates
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  // Empty state
  const hasNoAssignments = assignmentsToDisplay.length === 0;

  return (
    <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg mb-10 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-6">Upcoming Assignments</h2>

      {hasNoAssignments ? (
        <div className="flex flex-col items-center justify-center py-10 text-center flex-grow">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming assignments</h3>
          <p className="text-gray-500 mb-6">You don&apos;t have any upcoming assignments at the moment.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 flex-grow overflow-auto">
            {/* Assignment items */}
            {assignmentsToDisplay.map((assignment) => (
              <AssignmentItem key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </>
      )}

      {/* 1rem padding above the button and 1rem margin from bottom */}
      <div className="pt-4">
        <button
          type="button"
          className="w-full flex items-center justify-center py-3 mt-auto px-4 bg-[var(--glide-blue-10)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer font-bold"
          onClick={() => window.location.href = '/assignments'}
        >
          View All Assignments
        </button>
      </div>
    </div>
  );
}

// Assignment Item Component
function AssignmentItem({ assignment }: { assignment: Assignment }) {
  // Format the due date
  const dueDate = formatDate(assignment.due_at);

  // Determine if the assignment is due soon (within 3 days)
  const isDueSoon = () => {
    if (!assignment.due_at) return false;

    try {
      const now = new Date();
      const dueDate = new Date(assignment.due_at);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays <= 3 && diffDays >= 0;
    } catch (e) {
      console.error('Error calculating due date:', e);
      return false;
    }
  };

  // Format date to display in a readable format (Apr 12)
  function formatDate(dateString: string | null) {
    if (!dateString) return 'No due date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg p-4 hover:bg-[var(--light-grey)] transition-colors cursor-pointer">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-[var(--glide-blue-20)] rounded-lg flex items-center justify-center mr-4">
          <FileIcon className="h-5 w-5 text-[var(--glide-blue)]" />
        </div>
        <div>
          <h3 className="font-medium text-[var(--primary-color)]">{assignment.name}</h3>
          <p className="text-sm text-[var(--secondary-color)]">
            {assignment.course_code || assignment.course_name || 'Unknown Course'}
          </p>
        </div>
      </div>
      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
        isDueSoon()
          ? 'bg-[var(--secondary-color)] text-white'
          : 'bg-[var(--glide-blue-20)] text-[var(--glide-blue)]'
      }`}>
        {dueDate}
      </div>
    </div>
  );
}
