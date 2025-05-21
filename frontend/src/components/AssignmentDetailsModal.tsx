'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getAssignmentDetails } from '@/services/api';

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
  description?: string;
  submission_types?: string[];
  grade_info?: {
    score: number | null;
    grade: string | null;
    submitted_at: string | null;
    late: boolean;
    missing: boolean;
    graded: boolean;
    points_possible: number | null;
    percentage: string | null;
  };
}

interface AssignmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
}

export function AssignmentDetailsModal({
  open,
  onOpenChange,
  assignment
}: AssignmentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedAssignment, setDetailedAssignment] = useState<Assignment | null>(null);

  // Fetch detailed assignment information when the modal opens
  useEffect(() => {
    if (open && assignment) {
      const fetchAssignmentDetails = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await getAssignmentDetails(assignment.course_id!, assignment.id);
          setDetailedAssignment(response.assignment);
        } catch (err: unknown) {
          console.error('Failed to fetch assignment details:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch assignment details');
        } finally {
          setLoading(false);
        }
      };

      fetchAssignmentDetails();
    }
  }, [open, assignment]);

  // Use the detailed assignment if available, otherwise fall back to the passed assignment
  const displayAssignment = detailedAssignment || assignment;

  if (!assignment) {
    return null;
  }

  // Format due date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Format due time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Determine status and get appropriate icon
  const getStatusInfo = () => {
    if (!displayAssignment.grade_info) {
      return {
        label: 'Not submitted',
        icon: <AlertCircle className="h-5 w-5 text-[var(--glide-blue-50)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (displayAssignment.grade_info.graded) {
      return {
        label: 'Graded',
        icon: <CheckCircle className="h-5 w-5 text-[var(--glide-blue)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (displayAssignment.grade_info.submitted_at) {
      return {
        label: 'Submitted',
        icon: <CheckCircle className="h-5 w-5 text-[var(--glide-blue)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (displayAssignment.grade_info.missing) {
      return {
        label: 'Missing',
        icon: <XCircle className="h-5 w-5 text-[var(--secondary-color)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--white-grey)]'
      };
    }

    if (displayAssignment.grade_info.late) {
      return {
        label: 'Late',
        icon: <AlertCircle className="h-5 w-5 text-[var(--secondary-color)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--white-grey)]'
      };
    }

    return {
      label: 'Not submitted',
      icon: <AlertCircle className="h-5 w-5 text-[var(--glide-blue-50)]" />,
      color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--primary-color)]">
            {displayAssignment.name}
          </DialogTitle>
          <DialogDescription className="text-[var(--secondary-color)]">
            {displayAssignment.course_name || displayAssignment.course_code}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-[var(--glide-blue)] animate-spin mb-4" />
            <p className="text-[var(--secondary-color)]">Loading assignment details...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="bg-[var(--white-grey)] text-[var(--primary-color)] p-4 rounded-md mb-4 border border-[var(--secondary-color)] border-opacity-20">
              <p className="font-medium">Error loading assignment details</p>
              <p className="text-sm mt-1 text-[var(--secondary-color)]">{error}</p>
            </div>
            <p className="text-[var(--secondary-color)]">
              You can still view basic assignment information below.
            </p>
          </div>
        ) : (
          <div className="py-4">
            {/* Status badge */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="ml-2 text-sm font-medium">{statusInfo.label}</span>
              </div>
            </div>

            {/* Due date and points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-[var(--secondary-color)] mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--primary-color)]">Due Date</h4>
                  <p className="text-[var(--secondary-color)]">{formatDate(displayAssignment.due_at)}</p>
                  {displayAssignment.due_at && (
                    <p className="text-[var(--secondary-color)] text-sm">{formatTime(displayAssignment.due_at)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-[var(--secondary-color)] mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--primary-color)]">Points</h4>
                  <p className="text-[var(--secondary-color)]">
                    {displayAssignment.points_possible !== null && displayAssignment.points_possible !== undefined
                      ? `${displayAssignment.points_possible} points possible`
                      : 'No points assigned'}
                  </p>
                  {displayAssignment.grade_info?.score !== null && displayAssignment.grade_info?.score !== undefined && (
                    <p className="text-[var(--primary-color)] font-medium">
                      Your score: {displayAssignment.grade_info.score}
                      {displayAssignment.grade_info.percentage && ` (${displayAssignment.grade_info.percentage}%)`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">Description</h3>
              {displayAssignment.description ? (
                <div
                  className="prose max-w-none text-[var(--secondary-color)]"
                  dangerouslySetInnerHTML={{ __html: displayAssignment.description }}
                />
              ) : (
                <p className="text-[var(--secondary-color)]">No description available.</p>
              )}
            </div>

            {/* Submission types */}
            {displayAssignment.submission_types && displayAssignment.submission_types.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">Submission Type</h3>
                <ul className="list-disc pl-5 text-[var(--secondary-color)]">
                  {displayAssignment.submission_types.map((type, index) => (
                    <li key={index} className="capitalize">{type.replace('_', ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <div>
            {displayAssignment.grade_info?.submitted_at && (
              <p className="text-sm text-[var(--secondary-color)]">
                Submitted: {new Date(displayAssignment.grade_info.submitted_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={displayAssignment.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[var(--glide-blue)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View in Canvas
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
