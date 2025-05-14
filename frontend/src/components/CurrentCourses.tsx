'use client';

import React, { useState } from 'react';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

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
  teachers?: Teacher[];
  grade?: {
    score: number | null;
    letter: string | null;
    has_grade: boolean;
  };
}

interface CurrentCoursesProps {
  courses: Course[];
  loading: boolean;
}

export function CurrentCourses({ courses = [], loading = false }: CurrentCoursesProps) {
  // State to track whether to show all courses or just the first 5
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Course color mapping
  const courseColors = [
    'bg-[var(--course-blue)]',
    'bg-[var(--course-purple)]',
    'bg-[var(--course-green)]',
    'bg-[var(--course-amber)]',
    'bg-[var(--course-pink)]',
    'bg-[var(--course-indigo)]'
  ];

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Show 6 skeleton cards */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6 h-40 animate-pulse">
              <div className="h-4 w-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 w-12 bg-gray-200 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  const hasNoCourses = courses.length === 0;

  // Determine which courses to display
  const displayCourses = showAllCourses ? courses : courses.slice(0, 5);

  // Toggle function to show/hide all courses
  const toggleShowAllCourses = () => {
    setShowAllCourses(!showAllCourses);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Courses</h2>

      {hasNoCourses ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6.25278V19.2528M12 6.25278C10.8321 6.25278 9.66886 6.58431 8.66654 7.20845C7.66421 7.83259 6.87235 8.72201 6.4362 9.76121C5.66309 11.5152 5.86082 13.5246 6.98202 15.1258C7.40435 15.7054 7.92777 16.2114 8.52733 16.6185M12 6.25278C13.1679 6.25278 14.3311 6.58431 15.3335 7.20845C16.3358 7.83259 17.1276 8.72201 17.5638 9.76121C18.3369 11.5152 18.1392 13.5246 17.018 15.1258C16.5957 15.7054 16.0722 16.2114 15.4727 16.6185" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-6">You don&apos;t have any current courses. Add a course to get started.</p>
          <AddCourseCard />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Course cards */}
            {displayCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                colorClass={courseColors[index % courseColors.length]}
              />
            ))}

            {/* Add Course card - always show */}
            <AddCourseCard />
          </div>

          {/* Toggle button to show/hide all courses */}
          {courses.length > 5 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={toggleShowAllCourses}
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
              >
                {showAllCourses ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUpIcon className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>View All Courses</span>
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Course Card Component
function CourseCard({ course, colorClass }: { course: Course, colorClass: string }) {
  // Format the grade to show as a percentage
  const gradePercentage = course.grade?.score !== null && course.grade?.score !== undefined
    ? `${Math.round(course.grade.score)}%`
    : null;

  // Get the primary teacher's name if available
  const primaryTeacher = course.teachers && course.teachers.length > 0
    ? course.teachers[0].display_name
    : null;

  return (
    <div className={`${colorClass} rounded-lg p-4 flex flex-col relative h-40`}>
      {/* Course code */}
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-[var(--card-text-secondary)]">
          {course.course_code}
        </span>
        <button
          type="button"
          className="text-[var(--card-text-secondary)] hover:text-[var(--card-text)] transition-colors"
          aria-label="Course settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12C4 12.5523 4.44772 13 5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 12C18 12.5523 18.4477 13 19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Course name */}
      <h3 className="text-xl font-bold text-[var(--card-text)] mt-2 mb-1">
        {course.name}
      </h3>

      {/* Professor name */}
      {primaryTeacher && (
        <p className="text-sm text-[var(--card-text-secondary)] mb-auto">
          {primaryTeacher}
        </p>
      )}

      {/* Grade percentage */}
      {gradePercentage && (
        <div className="self-end bg-white bg-opacity-20 text-[var(--card-text)] px-3 py-1 rounded-md text-sm font-medium">
          {gradePercentage}
        </div>
      )}
    </div>
  );
}

// Add Course Card Component
function AddCourseCard() {
  return (
    <button
      type="button"
      className="bg-gray-100 hover:bg-gray-200 rounded-lg p-4 flex flex-col items-center justify-center h-40 cursor-pointer transition-colors border-2 border-dashed border-gray-300 w-full"
      aria-label="Add a new course"
    >
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
        <PlusIcon className="h-6 w-6 text-gray-500" />
      </div>
      <span className="text-gray-600 font-medium">Add Course</span>
    </button>
  );
}
