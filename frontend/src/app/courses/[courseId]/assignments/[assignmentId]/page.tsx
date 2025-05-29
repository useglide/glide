'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAssignmentDetails } from '@/services/api';
import { Header } from '@/components/Header';
import { SubmissionForm } from '@/components/SubmissionForm';
import { SubmissionDetails } from '@/components/SubmissionDetails';
import { Calendar, FileText, CheckCircle, XCircle, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// Define Auth context interface
interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  logout: () => Promise<void>;
}

// Define API response interface
interface AssignmentResponse {
  assignment: Assignment;
}

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

export default function AssignmentDetailsPage({ params }: { params: Promise<{ courseId: string, assignmentId: string }> }) {
  // Use the 'use' hook to unwrap the params Promise
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const assignmentId = parseInt(resolvedParams.assignmentId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { user, logout } = useAuth() as AuthContextType;
  const router = useRouter();

  // Fetch assignment details when the component mounts
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAssignmentDetails(courseId, assignmentId) as AssignmentResponse;
        setAssignment(response.assignment);
      } catch (err: unknown) {
        console.error('Failed to fetch assignment details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [user, router, courseId, assignmentId]);

  // Refetch assignment details function
  const refetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAssignmentDetails(courseId, assignmentId) as AssignmentResponse;
      setAssignment(response.assignment);
    } catch (err: unknown) {
      console.error('Failed to fetch assignment details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment details');
    } finally {
      setLoading(false);
    }
  };

  // Handle submission success
  const handleSubmissionSuccess = () => {
    setSubmissionMessage({ type: 'success', text: 'Assignment submitted successfully!' });
    // Refresh assignment details to show updated submission status
    refetchAssignmentDetails();
    // Clear message after 5 seconds
    setTimeout(() => setSubmissionMessage(null), 5000);
  };

  // Handle submission error
  const handleSubmissionError = (errorMessage: string) => {
    setSubmissionMessage({ type: 'error', text: errorMessage });
    // Clear message after 5 seconds
    setTimeout(() => setSubmissionMessage(null), 5000);
  };

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
    if (!assignment?.grade_info) {
      return {
        label: 'Not submitted',
        icon: <AlertCircle className="h-5 w-5 text-[var(--glide-blue-50)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (assignment.grade_info.graded) {
      return {
        label: 'Graded',
        icon: <CheckCircle className="h-5 w-5 text-[var(--glide-blue)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (assignment.grade_info.submitted_at) {
      return {
        label: 'Submitted',
        icon: <CheckCircle className="h-5 w-5 text-[var(--glide-blue)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--glide-blue-10)]'
      };
    }

    if (assignment.grade_info.missing) {
      return {
        label: 'Missing',
        icon: <XCircle className="h-5 w-5 text-[var(--secondary-color)]" />,
        color: 'text-[var(--primary-color)] bg-[var(--white-grey)]'
      };
    }

    if (assignment.grade_info.late) {
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

  const statusInfo = assignment ? getStatusInfo() : null;

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header title={assignment?.name || 'Assignment Details'} onLogout={logout} />

      <div className="px-6 py-6">
        {/* Back to course link */}
        <div className="mb-4">
          <Link href={`/courses/${courseId}`} className="inline-flex items-center text-[var(--glide-blue)] hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
        </div>

        {loading ? (
          <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[var(--glide-blue)] animate-spin mb-4" />
            <p className="text-[var(--secondary-color)]">Loading assignment details...</p>
          </div>
        ) : error ? (
          <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
            <div className="bg-[var(--white-grey)] text-[var(--primary-color)] p-4 rounded-md mb-4 border border-[var(--secondary-color)] border-opacity-20">
              <p className="font-medium">Error loading assignment details</p>
              <p className="text-sm mt-1 text-[var(--secondary-color)]">{error}</p>
            </div>
            <Link href={`/courses/${courseId}`} className="text-[var(--glide-blue)] hover:underline">
              Return to course page
            </Link>
          </div>
        ) : assignment ? (
          <div className="space-y-6">
            {/* Submission Message */}
            {submissionMessage && (
              <div className={`p-4 rounded-lg ${
                submissionMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {submissionMessage.text}
              </div>
            )}

            <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--primary-color)] mb-2">{assignment.name}</h1>
                <p className="text-[var(--secondary-color)]">{assignment.course_name || assignment.course_code}</p>
              </div>

            {/* Status badge */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full ${statusInfo?.color}`}>
                {statusInfo?.icon}
                <span className="ml-2 text-sm font-medium">{statusInfo?.label}</span>
              </div>
            </div>

            {/* Due date and points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-[var(--secondary-color)] mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--primary-color)]">Due Date</h4>
                  <p className="text-[var(--secondary-color)]">{formatDate(assignment.due_at)}</p>
                  {assignment.due_at && (
                    <p className="text-[var(--secondary-color)] text-sm">{formatTime(assignment.due_at)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-[var(--secondary-color)] mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--primary-color)]">Points</h4>
                  <p className="text-[var(--secondary-color)]">
                    {assignment.points_possible !== null && assignment.points_possible !== undefined
                      ? `${assignment.points_possible} points possible`
                      : 'No points assigned'}
                  </p>
                  {assignment.grade_info?.score !== null && assignment.grade_info?.score !== undefined && (
                    <p className="text-[var(--primary-color)] font-medium">
                      Your score: {Number.isInteger(assignment.grade_info.score)
                        ? assignment.grade_info.score
                        : Math.round(assignment.grade_info.score)}
                      {assignment.grade_info.percentage && ` (${Math.round(parseFloat(assignment.grade_info.percentage))}%)`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">Description</h3>
              {assignment.description ? (
                <div
                  className="prose max-w-none text-[var(--secondary-color)]"
                  dangerouslySetInnerHTML={{ __html: assignment.description }}
                />
              ) : (
                <p className="text-[var(--secondary-color)]">No description available.</p>
              )}
            </div>

            {/* Submission types */}
            {assignment.submission_types && assignment.submission_types.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">Submission Type</h3>
                <ul className="list-disc pl-5 text-[var(--secondary-color)]">
                  {assignment.submission_types.map((type, index) => (
                    <li key={index} className="capitalize">{type.replace('_', ' ')}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submission status */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">Submission Status</h3>
              {assignment.grade_info?.submitted_at ? (
                <p className="text-[var(--secondary-color)]">
                  Submitted on {new Date(assignment.grade_info.submitted_at).toLocaleString()}
                </p>
              ) : (
                <p className="text-[var(--secondary-color)]">Not submitted yet</p>
              )}
            </div>

            {/* Detailed Submission Information */}
            {assignment.grade_info?.submitted_at && (
              <div className="mb-6">
                <SubmissionDetails
                  courseId={courseId}
                  assignmentId={assignmentId}
                  onError={(error) => setSubmissionMessage({ type: 'error', text: error })}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end mt-8">
              <a
                href={assignment.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--glide-blue)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                View in Canvas
              </a>
            </div>
          </div>

          {/* Submission Form */}
          {assignment.submission_types && assignment.submission_types.length > 0 && !assignment.grade_info?.submitted_at && (
            <SubmissionForm
              courseId={courseId}
              assignmentId={assignmentId}
              submissionTypes={assignment.submission_types}
              onSubmissionSuccess={handleSubmissionSuccess}
              onSubmissionError={handleSubmissionError}
            />
          )}
        </div>
        ) : (
          <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
            <p className="text-[var(--secondary-color)]">Assignment not found.</p>
          </div>
        )}
      </div>
    </>
  );
}
