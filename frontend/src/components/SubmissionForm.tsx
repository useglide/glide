'use client';

import React, { useState } from 'react';
import { Upload, Link, FileText, Send, Loader2 } from 'lucide-react';
import { submitAssignment, uploadSubmissionFile } from '@/services/api';

// Type definition for upload function
type UploadSubmissionFileFunction = (
  courseId: number,
  assignmentId: number,
  userId: string | number,
  file: File
) => Promise<{ upload: { file_id: number } }>;

interface SubmissionFormProps {
  courseId: number;
  assignmentId: number;
  submissionTypes: string[];
  onSubmissionSuccess: () => void;
  onSubmissionError: (error: string) => void;
}

export function SubmissionForm({
  courseId,
  assignmentId,
  submissionTypes,
  onSubmissionSuccess,
  onSubmissionError
}: SubmissionFormProps) {
  const [submissionType, setSubmissionType] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [urlContent, setUrlContent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Submit the assignment
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!submissionType) {
      onSubmissionError('Please select a submission type');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submissionData: {
        submission_type: string;
        comment?: string;
        body?: string;
        url?: string;
        file_ids?: number[];
      } = {
        submission_type: submissionType,
        comment: comment || undefined
      };

      // Handle different submission types
      if (submissionType === 'online_text_entry') {
        if (!textContent.trim()) {
          onSubmissionError('Please enter text content for your submission');
          return;
        }
        submissionData.body = textContent;
      } else if (submissionType === 'online_url') {
        if (!urlContent.trim()) {
          onSubmissionError('Please enter a URL for your submission');
          return;
        }
        submissionData.url = urlContent;
      } else if (submissionType === 'online_upload') {
        if (files.length === 0) {
          onSubmissionError('Please select files to upload');
          return;
        }

        // Upload files first
        const fileIds: number[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress((i / files.length) * 50); // First 50% for uploads

          try {
            const uploadResult = await (uploadSubmissionFile as UploadSubmissionFileFunction)(courseId, assignmentId, 'self', file);
            console.log('Upload result:', uploadResult);

            // Use the actual file ID from Canvas
            if (uploadResult.upload && uploadResult.upload.file_id) {
              fileIds.push(uploadResult.upload.file_id);
            } else {
              throw new Error('No file ID received from upload');
            }
          } catch (error) {
            console.error('File upload failed:', error);
            onSubmissionError(`Failed to upload file: ${file.name}`);
            return;
          }
        }

        submissionData.file_ids = fileIds;
      }

      setUploadProgress(75); // 75% for submission

      // Submit the assignment
      const result = await submitAssignment(courseId, assignmentId, submissionData);

      setUploadProgress(100);
      console.log('Submission successful:', result);
      onSubmissionSuccess();

      // Reset form
      setSubmissionType('');
      setTextContent('');
      setUrlContent('');
      setFiles([]);
      setComment('');

    } catch (error) {
      console.error('Submission failed:', error);
      onSubmissionError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Get available submission types
  const availableTypes = submissionTypes.filter(type =>
    ['online_text_entry', 'online_url', 'online_upload'].includes(type)
  );

  if (availableTypes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          This assignment does not support online submissions through this interface.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-[var(--primary-color)] mb-4">Submit Assignment</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submission Type Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
            Submission Type
          </label>
          <select
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
            required
          >
            <option value="">Select submission type...</option>
            {availableTypes.includes('online_text_entry') && (
              <option value="online_text_entry">Text Entry</option>
            )}
            {availableTypes.includes('online_url') && (
              <option value="online_url">Website URL</option>
            )}
            {availableTypes.includes('online_upload') && (
              <option value="online_upload">File Upload</option>
            )}
          </select>
        </div>

        {/* Text Entry */}
        {submissionType === 'online_text_entry' && (
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Text Submission
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
              placeholder="Enter your submission text here..."
              required
            />
          </div>
        )}

        {/* URL Entry */}
        {submissionType === 'online_url' && (
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              <Link className="inline w-4 h-4 mr-1" />
              Website URL
            </label>
            <input
              type="url"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
              placeholder="https://example.com"
              required
            />
          </div>
        )}

        {/* File Upload */}
        {submissionType === 'online_upload' && (
          <div>
            <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
              <Upload className="inline w-4 h-4 mr-1" />
              File Upload
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[var(--glide-blue)] transition-colors"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-[var(--glide-blue)] cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </p>
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-[var(--secondary-color)] mb-2">
                    Selected files:
                  </p>
                  <ul className="text-sm text-gray-600">
                    {files.map((file, index) => (
                      <li key={index} className="flex justify-between items-center py-1">
                        <span>{file.name}</span>
                        <span className="text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] focus:border-transparent"
            placeholder="Add a comment to your submission..."
          />
        </div>

        {/* Progress Bar */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[var(--glide-blue)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-[var(--glide-blue)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}
