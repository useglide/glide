'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, Link as LinkIcon, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { getSubmissionDetails, downloadSubmissionFile } from '@/services/api';

// Type definitions for API functions
type GetSubmissionDetailsFunction = (
  courseId: number,
  assignmentId: number,
  userId?: string | number
) => Promise<{ status: string; submission?: SubmissionDetails }>;

type DownloadSubmissionFileFunction = (
  courseId: number,
  assignmentId: number,
  userId: string | number,
  fileId: number
) => Promise<Blob>;

// Define interfaces for submission data
interface SubmissionAttachment {
  id: number;
  filename: string;
  display_name: string;
  size: number;
  content_type: string;
  url: string;
}

interface SubmissionComment {
  id: number;
  comment: string;
  created_at: string;
  author_name: string;
}

interface SubmissionDetails {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_type: string;
  submitted_at: string;
  body?: string;
  url?: string;
  attachments?: SubmissionAttachment[];
  submission_comments?: SubmissionComment[];
  attempt: number;
  late: boolean;
  missing: boolean;
  workflow_state: string;
}

interface SubmissionDetailsProps {
  courseId: number;
  assignmentId: number;
  userId?: string | number;
  onError?: (error: string) => void;
}

export function SubmissionDetails({ courseId, assignmentId, userId = 'self', onError }: SubmissionDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        setLoading(true);
        const response = await (getSubmissionDetails as GetSubmissionDetailsFunction)(courseId, assignmentId, userId);

        console.log('Submission details response:', response);

        if (response.status === 'success' && response.submission) {
          console.log('Submission details:', response.submission);
          setSubmissionDetails(response.submission);
        } else {
          setSubmissionDetails(null);
        }
      } catch (error) {
        console.error('Failed to fetch submission details:', error);
        if (onError) {
          onError(error instanceof Error ? error.message : 'Failed to fetch submission details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [courseId, assignmentId, userId, onError]);

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      console.log('Starting download for file:', { fileId, filename, courseId, assignmentId, userId });
      setDownloadingFiles(prev => new Set(prev).add(fileId));

      const blob = await (downloadSubmissionFile as DownloadSubmissionFileFunction)(courseId, assignmentId, userId, fileId);
      console.log('Download successful, blob size:', blob.size);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      if (onError) {
        onError(`Failed to download ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSubmissionTypeDisplay = (type: string): string => {
    switch (type) {
      case 'online_text_entry':
        return 'Text Entry';
      case 'online_url':
        return 'Website URL';
      case 'online_upload':
        return 'File Upload';
      case 'media_recording':
        return 'Media Recording';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-6 rounded-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-[var(--glide-blue)] animate-spin mr-2" />
          <span className="text-[var(--secondary-color)]">Loading submission details...</span>
        </div>
      </div>
    );
  }

  if (!submissionDetails) {
    return null; // Don't show anything if no submission exists
  }

  return (
    <div className="bg-[var(--white-grey)] p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-medium text-[var(--primary-color)] mb-4">Your Submission</h3>

      {/* Submission Status */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 text-[var(--glide-blue)] mr-2" />
          <span className="text-sm font-medium text-[var(--primary-color)]">
            Submitted on {new Date(submissionDetails.submitted_at).toLocaleString()}
          </span>
          {submissionDetails.late && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Late
            </span>
          )}
        </div>
        <div className="text-sm text-[var(--secondary-color)]">
          Submission Type: {getSubmissionTypeDisplay(submissionDetails.submission_type)}
          {submissionDetails.attempt > 1 && (
            <span className="ml-2">• Attempt {submissionDetails.attempt}</span>
          )}
        </div>
      </div>

      {/* Submission Content */}
      <div className="space-y-4">
        {/* Text Entry */}
        {submissionDetails.submission_type === 'online_text_entry' && submissionDetails.body && (
          <div>
            <div className="flex items-center mb-2">
              <MessageSquare className="h-4 w-4 text-[var(--glide-blue)] mr-2" />
              <span className="text-sm font-medium text-[var(--primary-color)]">Submitted Text</span>
            </div>
            <div
              className="bg-white p-4 rounded border text-sm text-[var(--primary-color)]"
              dangerouslySetInnerHTML={{ __html: submissionDetails.body }}
            />
          </div>
        )}

        {/* URL Submission */}
        {submissionDetails.submission_type === 'online_url' && submissionDetails.url && (
          <div>
            <div className="flex items-center mb-2">
              <LinkIcon className="h-4 w-4 text-[var(--glide-blue)] mr-2" />
              <span className="text-sm font-medium text-[var(--primary-color)]">Submitted URL</span>
            </div>
            <a
              href={submissionDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--glide-blue)] hover:underline break-all"
            >
              {submissionDetails.url}
            </a>
          </div>
        )}

        {/* File Uploads */}
        {submissionDetails.submission_type === 'online_upload' && submissionDetails.attachments && submissionDetails.attachments.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 text-[var(--glide-blue)] mr-2" />
              <span className="text-sm font-medium text-[var(--primary-color)]">
                Submitted Files ({submissionDetails.attachments.length})
              </span>
            </div>
            <div className="space-y-2">
              {submissionDetails.attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex items-center flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-[var(--secondary-color)] mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--primary-color)] truncate">
                        {file.display_name || file.filename}
                      </div>
                      <div className="text-xs text-[var(--secondary-color)]">
                        {formatFileSize(file.size)} • {file.content_type}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileDownload(file.id, file.filename)}
                    disabled={downloadingFiles.has(file.id)}
                    className="ml-3 flex items-center px-3 py-1 bg-[var(--glide-blue)] text-white text-xs rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {downloadingFiles.has(file.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Comments */}
        {submissionDetails.submission_comments && submissionDetails.submission_comments.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <MessageSquare className="h-4 w-4 text-[var(--glide-blue)] mr-2" />
              <span className="text-sm font-medium text-[var(--primary-color)]">Comments</span>
            </div>
            <div className="space-y-2">
              {submissionDetails.submission_comments.map((comment) => (
                <div key={comment.id} className="bg-white p-3 rounded border">
                  <div className="text-xs text-[var(--secondary-color)] mb-1">
                    {comment.author_name} • {new Date(comment.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-[var(--primary-color)]">{comment.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
