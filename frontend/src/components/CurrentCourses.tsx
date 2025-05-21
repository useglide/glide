'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, Settings, RefreshCw, ArrowUpRight } from 'lucide-react';
import { CourseSelectionModal } from './CourseSelectionModal';
import { CourseSettingsModal } from './CourseSettingsModal';
import { darkenColor, isLightColor } from '@/lib/utils';
import { getTwoStageData, getDetailedCourseData } from '@/services/api';
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
  teachers?: Teacher[];
  grade?: number | null;
  displayName?: string;
  customColor?: string;
}

interface CurrentCoursesProps {
  courses: Course[];
  allCourses?: Course[];
  loading: boolean;
  refreshing?: boolean;
  onAddCourse?: (courseId: number) => void;
  onRemoveCourse?: (courseId: number) => void;
  onUpdateColor?: (courseId: number, color: string) => void;
  onRefreshData?: () => void;
}

export function CurrentCourses({
  courses = [],
  allCourses = [],
  loading = false,
  refreshing = false,
  onAddCourse,
  onRemoveCourse,
  onUpdateColor,
  onRefreshData
}: CurrentCoursesProps) {
  // Initialize router for navigation
  const router = useRouter();

  // State to track whether to show all courses or just the first 5
  const [showAllCourses, setShowAllCourses] = useState(false);
  // State to control the course selection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to control the course settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // State to track the currently selected course for settings
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  // State to store courses with custom settings
  const [customizedCourses, setCustomizedCourses] = useState<Course[]>([]);

  // Course color mapping
  const courseColors = [
    'bg-[var(--course-blue)]',
    'bg-[var(--course-purple)]',
    'bg-[var(--course-green)]',
    'bg-[var(--course-amber)]',
    'bg-[var(--course-pink)]',
    'bg-[var(--course-indigo)]'
  ];

  // Initialize customized courses from localStorage on component mount
  useEffect(() => {
    const savedCourses = localStorage.getItem('customizedCourses');
    if (savedCourses) {
      try {
        setCustomizedCourses(JSON.parse(savedCourses));
      } catch (error) {
        console.error('Failed to parse customized courses from localStorage:', error);
      }
    }
  }, []);

  // Save customized courses to localStorage whenever they change
  useEffect(() => {
    if (customizedCourses.length > 0) {
      localStorage.setItem('customizedCourses', JSON.stringify(customizedCourses));
    }
  }, [customizedCourses]);

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Show 6 skeleton cards */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6 min-h-[10rem] animate-pulse">
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

  // Determine which courses to display - show 6 by default
  const displayCourses = showAllCourses ? courses : courses.slice(0, 6);

  // Toggle function to show/hide all courses
  const toggleShowAllCourses = () => {
    setShowAllCourses(!showAllCourses);
  };

  // Handle opening the modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handle adding a course
  const handleAddCourse = (courseId: number) => {
    if (onAddCourse) {
      onAddCourse(courseId);
    }
  };

  // Handle opening the settings modal
  const handleOpenSettings = (course: Course) => {
    setSelectedCourse(course);
    setIsSettingsModalOpen(true);
  };

  // Handle saving course settings
  const handleSaveSettings = (courseId: number, displayName: string, customColor: string) => {
    // Find the course in the courses array
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Create a new customized course or update existing one
    const updatedCourse = { ...course, displayName, customColor };

    // Check if this course is already customized
    const existingIndex = customizedCourses.findIndex(c => c.id === courseId);

    if (existingIndex >= 0) {
      // Update existing customized course
      const updatedCustomizedCourses = [...customizedCourses];
      updatedCustomizedCourses[existingIndex] = updatedCourse;
      setCustomizedCourses(updatedCustomizedCourses);
    } else {
      // Add new customized course
      setCustomizedCourses([...customizedCourses, updatedCourse]);
    }

    // If we have an onUpdateColor callback, call it with the course ID and color
    if (onUpdateColor) {
      onUpdateColor(courseId, customColor);
    }
  };

  // Get customized course data if available
  const getCustomizedCourse = (courseId: number) => {
    return customizedCourses.find(c => c.id === courseId);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefreshData && !refreshing && !loading) {
      onRefreshData();
    }
  };

  return (
    <div className="bg-[var(--white-grey)] p-10 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[var(--primary-color)]">Current Courses</h2>
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
          <AddCourseCard onClick={handleOpenModal} />
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
                onOpenSettings={handleOpenSettings}
                customizedCourse={getCustomizedCourse(course.id)}
              />
            ))}

            {/* Add Course card - only show if showing all courses or if we have less than 6 courses */}
            {(showAllCourses || courses.length < 6) && (
              <AddCourseCard onClick={handleOpenModal} />
            )}
          </div>

          {/* Toggle button to show/hide all courses */}
          {courses.length >= 6 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={toggleShowAllCourses}
                className="w-full flex items-center justify-center py-3 px-4 bg-[var(--glide-blue-10)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer font-bold"
              >
                {showAllCourses ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUpIcon className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>View All Favorites</span>
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Course Selection Modal */}
      <CourseSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        allCourses={allCourses.map(course => ({
          ...course,
          grade: course.grade !== undefined ? {
            score: course.grade,
            letter: null,
            has_grade: course.grade !== null
          } : undefined
        }))}
        currentCourses={courses.map(course => ({
          ...course,
          grade: course.grade !== undefined ? {
            score: course.grade,
            letter: null,
            has_grade: course.grade !== null
          } : undefined
        }))}
        onAddCourse={handleAddCourse}
        onRemoveCourse={onRemoveCourse}
        loading={loading}
      />

      {/* Course Settings Modal */}
      {selectedCourse && (
        <CourseSettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          course={selectedCourse}
          onSaveSettings={handleSaveSettings}
          predefinedColors={courseColors}
        />
      )}
    </div>
  );
}



// Course Card Component
function CourseCard({
  course,
  colorClass,
  onOpenSettings,
  customizedCourse
}: {
  course: Course,
  colorClass: string,
  onOpenSettings: (course: Course) => void,
  customizedCourse?: Course | null
}) {
  // Initialize router for navigation
  const router = useRouter();
  // Format the grade to show as a percentage
  const gradePercentage = course.grade !== null && course.grade !== undefined
    ? `${Math.round(course.grade)}%`
    : null;

  // Get the primary teacher's name if available
  const primaryTeacher = course.teachers && course.teachers.length > 0
    ? course.teachers[0].display_name
    : null;

  // Use custom color if available, otherwise use the default color
  const cardColor = customizedCourse?.customColor || colorClass;

  // Use custom display name if available, otherwise use the default name
  const displayName = customizedCourse?.displayName || course.name;

  // Determine if the card color is light or dark
  let bgColor: string;
  if (cardColor.startsWith('bg-')) {
    // Extract the CSS variable from the class name
    const cssVar = cardColor.replace('bg-[var(--', '').replace(')]', '');
    bgColor = `var(--${cssVar})`;
  } else {
    bgColor = cardColor;
  }

  // For course cards, we want to use a darker shade of the same color for text
  // We'll apply the text color directly in the style attribute
  let textColorStyle: string;

  // For CSS variables
  if (bgColor.startsWith('var(--')) {
    // Extract the variable name
    const varName = bgColor.replace('var(--', '').replace(')', '');

    // Map CSS variables to their approximate hex values
    const cssVarMap: Record<string, string> = {
      'course-blue': '#E0EFFF',    // Light blue
      'course-purple': '#EDE9FE',  // Light purple
      'course-green': '#DCFCE7',   // Light green
      'course-amber': '#FEF3C7',   // Light amber/yellow
      'course-pink': '#FCE7F3',    // Light pink
      'course-indigo': '#6366f1'   // Indigo (darker)
    };

    const hexColor = cssVarMap[varName];
    if (hexColor) {
      if (isLightColor(hexColor)) {
        // For light backgrounds, return a darker, more vibrant shade of the same color
        textColorStyle = darkenColor(hexColor, 60);
      } else {
        // For dark backgrounds, return white
        textColorStyle = 'white';
      }
    } else if (varName === 'course-indigo') {
      textColorStyle = 'white'; // It's dark, so use white
    } else if (varName.startsWith('course-')) {
      // Most course colors are light, so darken them
      textColorStyle = darkenColor('#E0E0FF', 60);
    } else {
      textColorStyle = '#1E293B'; // Default
    }
  } else if (bgColor.startsWith('#')) {
    // For hex colors
    if (isLightColor(bgColor)) {
      // For light backgrounds, return a darker, more vibrant shade of the same color
      textColorStyle = darkenColor(bgColor, 60);
    } else {
      // For dark backgrounds, return white
      textColorStyle = 'white';
    }
  } else {
    textColorStyle = '#1E293B'; // Default
  }

  // Use Tailwind classes for text colors when possible
  const textColor = textColorStyle === 'white' ? 'text-white' : '';
  const secondaryTextColor = textColorStyle === 'white' ? 'text-white/80' : '';

  // Determine the class name based on whether we're using a custom color or a predefined one
  const cardClassName = cardColor.startsWith('bg')
    ? `${cardColor} rounded-2xl p-4 flex flex-col relative min-h-[10rem]`
    : 'rounded-2xl p-4 flex flex-col relative min-h-[10rem]';

  return (
    <div
      className={`${cardClassName} cursor-pointer`}
      style={cardColor.startsWith('bg-') ? {} : { backgroundColor: cardColor }}
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      {/* Course code and settings icon */}
      <div className="flex justify-between items-start">
        <span
          className={`text-xs font-semibold ${secondaryTextColor}`}
          style={{ color: textColorStyle }}
        >
          {course.course_code}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click from triggering
            onOpenSettings(course);
          }}
          className={`w-5 h-5 flex items-center justify-center ${secondaryTextColor} hover:${textColor} transition-colors cursor-pointer`}
          style={{ color: textColorStyle }}
          aria-label="Course settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Course name */}
      <h3
        className={`text-xl font-bold ${textColor} mt-2 mb-1 break-words`}
        style={{ color: textColorStyle }}
      >
        {displayName}
      </h3>

      {/* Professor name */}
      {primaryTeacher && (
        <p
          className={`text-sm ${secondaryTextColor} mb-auto`}
          style={{ color: textColorStyle }}
        >
          {primaryTeacher}
        </p>
      )}

      <div className="flex justify-between items-center mt-auto">
        {/* View details link */}
        <div
          className={`flex items-center text-sm font-medium ${textColor}`}
          style={{ color: textColorStyle }}
        >
          <span>View Details</span>
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </div>

        {/* Grade percentage */}
        {gradePercentage && (
          <div
            className="px-3 py-1 rounded-md text-sm font-bold"
            // regular style white background, black text
            style={{
              backgroundColor: 'var(--white-grey)',
              // if color is light use dark text
              color: textColorStyle === 'white' ? 'black' : textColorStyle,
            }}
          >
            {gradePercentage}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Course Card Component
function AddCourseCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-gray-100 hover:bg-gray-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[10rem] cursor-pointer transition-colors border-2 border-dashed border-gray-300 w-full"
      aria-label="Add a new course"
    >
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
        <PlusIcon className="h-6 w-6 text-gray-500" />
      </div>
      <span className="text-gray-600 font-medium">Edit Favorite Courses</span>
    </button>
  );
}
