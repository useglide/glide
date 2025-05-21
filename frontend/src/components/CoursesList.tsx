'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronUp, ChevronDown, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define the teacher interface
interface Teacher {
  id: number;
  display_name: string;
  avatar_image_url?: string;
}

// Define the course interface
interface Course {
  id: number;
  name: string;
  course_code: string;
  term?: string;
  teachers?: Teacher[];
  grade?: number | null;
  grade_letter?: string | null;
  displayName?: string;
}

interface CoursesListProps {
  courses: Course[];
  loading: boolean;
  refreshing?: boolean;
  onRefreshData?: () => void;
}

export function CoursesList({
  courses = [],
  loading = false,
  refreshing = false,
  onRefreshData
}: CoursesListProps) {
  // Initialize router for navigation
  const router = useRouter();

  // State for sorting
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // State to track expanded semesters
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

  // Load customized courses from localStorage and initialize expanded semesters
  useEffect(() => {
    // Group courses by term to find the most recent semester
    if (courses.length > 0) {
      const terms = courses.map(course => course.term || 'Unknown Term');
      const uniqueTerms = [...new Set(terms)];

      // Define term priority function (same as used for sorting)
      const getTermPriority = (term: string): number => {
        if (term.includes('2025')) {
          if (term.includes('Spring')) return 20;
          if (term.includes('Winter')) return 19;
          return 18; // Other 2025 terms
        }
        if (term.includes('2024')) {
          if (term.includes('Fall')) return 17;
          if (term.includes('Summer')) return 16;
          if (term.includes('Spring')) return 15;
          if (term.includes('Winter')) return 14;
          return 13; // Other 2024 terms
        }
        if (term.includes('2023')) {
          if (term.includes('Fall')) return 12;
          if (term.includes('Summer')) return 11;
          if (term.includes('Spring')) return 10;
          if (term.includes('Winter')) return 9;
          return 8; // Other 2023 terms
        }
        return 0; // Unknown or older terms
      };

      // Sort terms by priority (descending)
      const sortedTerms = [...uniqueTerms].sort((a, b) => {
        const priorityA = getTermPriority(a);
        const priorityB = getTermPriority(b);

        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        return a.localeCompare(b);
      });

      // Set the most recent term as expanded, others as collapsed
      const initialExpandedState: Record<string, boolean> = {};
      sortedTerms.forEach((term, index) => {
        initialExpandedState[term] = index === 0; // Only expand the first (most recent) term
      });

      setExpandedSemesters(initialExpandedState);
    }
  }, [courses]);

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* First semester skeleton */}
        <div className="mb-8">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-4 py-4">
                      <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-8 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Second semester skeleton */}
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="h-10 px-4 py-3 text-left">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-4 py-4">
                      <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-8 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefreshData && !refreshing && !loading) {
      onRefreshData();
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Group courses by semester/term
  const coursesByTerm: Record<string, Course[]> = {};

  // First, group courses by term
  courses.forEach(course => {
    const term = course.term || 'Unknown Term';
    if (!coursesByTerm[term]) {
      coursesByTerm[term] = [];
    }
    coursesByTerm[term].push(course);
  });

  // Sort terms by recency, with Spring 2025 as the most recent
  const sortedTerms = Object.keys(coursesByTerm).sort((a, b) => {
    // Define term priority (higher number = more recent)
    const getTermPriority = (term: string): number => {
      if (term.includes('2025')) {
        if (term.includes('Spring')) return 20;
        if (term.includes('Winter')) return 19;
        return 18; // Other 2025 terms
      }
      if (term.includes('2024')) {
        if (term.includes('Fall')) return 17;
        if (term.includes('Summer')) return 16;
        if (term.includes('Spring')) return 15;
        if (term.includes('Winter')) return 14;
        return 13; // Other 2024 terms
      }
      if (term.includes('2023')) {
        if (term.includes('Fall')) return 12;
        if (term.includes('Summer')) return 11;
        if (term.includes('Spring')) return 10;
        if (term.includes('Winter')) return 9;
        return 8; // Other 2023 terms
      }
      return 0; // Unknown or older terms
    };

    const priorityA = getTermPriority(a);
    const priorityB = getTermPriority(b);

    // Sort by priority (descending)
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // If same priority, sort alphabetically
    return a.localeCompare(b);
  });

  // Sort courses within each term
  sortedTerms.forEach(term => {
    coursesByTerm[term].sort((a, b) => {
      let aValue, bValue;

      // Get the appropriate values based on the sort field
      switch (sortField) {
        case 'name':
          // Use displayName if available, otherwise use name
          aValue = a.displayName || a.name;
          bValue = b.displayName || b.name;
          break;
        case 'code':
          aValue = a.course_code;
          bValue = b.course_code;
          break;
        case 'instructor':
          aValue = a.teachers && a.teachers.length > 0 ? a.teachers[0].display_name : '';
          bValue = b.teachers && b.teachers.length > 0 ? b.teachers[0].display_name : '';
          break;
        case 'grade':
          aValue = a.grade !== null && a.grade !== undefined ? a.grade : -1;
          bValue = b.grade !== null && b.grade !== undefined ? b.grade : -1;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      // Compare the values
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  });

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Toggle semester expanded state
  const toggleSemesterExpanded = (term: string) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [term]: !prev[term]
    }));
  };

  return (
    <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[var(--primary-color)]">All Courses</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center justify-center px-3 py-1.5 rounded-md bg-[var(--glide-blue-10)] transition-color cursor-pointer"
          aria-label="Refresh data"
        >
          <RefreshCw
            className={`h-4 w-4 text-[var(--glide-blue)] ${refreshing ? 'animate-spin' : ''}`}
          />
          <span className="ml-1.5 text-sm font-medium text-[var(--glide-blue)]">Refresh Data</span>
        </button>
      </div>

      <div className="space-y-8">
        {sortedTerms.map(term => {
          const isExpanded = expandedSemesters[term] || false;
          const courseCount = coursesByTerm[term].length;

          return (
            <div key={term} className="mb-8">
              <div
                className="flex items-center justify-between cursor-pointer py-2"
                onClick={() => toggleSemesterExpanded(term)}
              >
                <h3 className="text-xl font-bold text-[var(--primary-color)]">{term}</h3>
                <div className="flex items-center">
                  <span className="text-sm text-[var(--secondary-color)] mr-2">
                    {courseCount} {courseCount === 1 ? 'course' : 'courses'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[var(--secondary-color)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[var(--secondary-color)]" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--primary-color)] cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            <span>Course Name</span>
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--primary-color)] cursor-pointer"
                          onClick={() => handleSort('code')}
                        >
                          <div className="flex items-center">
                            <span>Course Code</span>
                            {getSortIcon('code')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--primary-color)] cursor-pointer"
                          onClick={() => handleSort('instructor')}
                        >
                          <div className="flex items-center">
                            <span>Instructor</span>
                            {getSortIcon('instructor')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--primary-color)] cursor-pointer"
                          onClick={() => handleSort('grade')}
                        >
                          <div className="flex items-center">
                            <span>Grade</span>
                            {getSortIcon('grade')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesByTerm[term].map((course) => {
                        // Use display name if available
                        const displayName = course.displayName || course.name;

                        // Format the grade to show as a percentage
                        const gradePercentage = course.grade !== null && course.grade !== undefined
                          ? `${Math.round(course.grade)}%`
                          : 'N/A';

                        // Get the grade letter if available
                        const gradeLetter = course.grade_letter || '';

                        // Get the primary teacher's name if available
                        const primaryTeacher = course.teachers && course.teachers.length > 0
                          ? course.teachers[0].display_name
                          : 'No instructor';

                        return (
                          <tr
                            key={course.id}
                            className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/courses/${course.id}`)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <span className="font-medium text-[var(--primary-color)]">{displayName}</span>
                                <ArrowUpRight className="ml-2 h-4 w-4 text-[var(--glide-blue)]" />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[var(--secondary-color)]">{course.course_code}</td>
                            <td className="px-4 py-4 text-[var(--secondary-color)]">{primaryTeacher}</td>
                            <td className="px-4 py-4">
                              <span className="font-medium text-[var(--primary-color)]">
                                {gradePercentage}
                                {gradeLetter && ` (${gradeLetter})`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!isExpanded && (
                <div className="mt-2 text-sm text-[var(--secondary-color)]">
                  Click to view {courseCount} {courseCount === 1 ? 'course' : 'courses'} from {term}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
