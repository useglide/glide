'use client';

import React from 'react';
import { Clock, CheckCircle, SmileIcon } from 'lucide-react';

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
}

interface YourProgressProps {
  loading?: boolean;
  currentGPA?: number;
  previousGPA?: number;
  completedCredits?: number;
  requiredCredits?: number;
  upcomingDeadlines?: number;
  dueThisWeek?: number;
  courses?: Course[]; // Array of course objects
}

export function YourProgress({
  loading = false,
  currentGPA: providedGPA = 3.78,
  previousGPA = 3.48,
  completedCredits,
  requiredCredits = 120,
  upcomingDeadlines = 0,
  dueThisWeek = 0,
  courses = []
}: YourProgressProps) {
  // Calculate GPA based on courses with grades
  const calculateGPA = () => {
    // Filter courses that have a grade
    const coursesWithGrades = courses.filter(course =>
      course.grade !== undefined && course.grade !== null
    );

    if (coursesWithGrades.length === 0) {
      return providedGPA; // Return provided GPA if no courses have grades
    }

    // Calculate total grade points and total courses
    const totalGradePoints = coursesWithGrades.reduce((sum, course) => {
      // Convert percentage to 4.0 scale (assuming 100% = 4.0, 0% = 0.0)
      // This is a simple conversion - actual GPA calculation might be more complex
      const gradePoint = (course.grade! / 100) * 4.0;
      return sum + gradePoint;
    }, 0);

    // Calculate GPA
    return totalGradePoints / coursesWithGrades.length;
  };

  // Get the calculated GPA
  const calculatedGPA = calculateGPA();

  // Use the calculated GPA or the provided GPA
  const currentGPA = calculatedGPA;

  // Calculate GPA change
  const gpaChange = currentGPA - previousGPA;

  // Calculate completed credits based on courses
  // Take the total number of courses and multiply by 3
  const calculatedCompletedCredits = courses.length * 3;

  // Use the calculated value or the provided value, or default to 0
  const displayedCompletedCredits = completedCredits !== undefined ? completedCredits : calculatedCompletedCredits;

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-full flex flex-col">
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex-grow"></div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="h-12 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-36 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-6">Your Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current GPA Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center">
            <h3 className="text-[var(--secondary-color)] text-lg font-medium">Current GPA</h3>
            <div className="flex items-center justify-center">
              <SmileIcon className="h-6 w-6 text-green-500" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-4xl mt-3 font-bold text-[var(--primary-color)]">{currentGPA.toFixed(2)}</div>
              <div className="text-sm mt-2 text-green-500 font-medium">
                +{gpaChange.toFixed(1)} from last semester
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center py-2 px-6 bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer text-sm font-medium h-fit"
            >
              Details
            </button>
          </div>
        </div>
        {/* Completed Credits Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center">
            <h3 className="text-[var(--secondary-color)] text-lg font-medium">Completed Credits</h3>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[var(--glide-blue)]" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-4xl mt-3 font-bold text-[var(--primary-color)]">{displayedCompletedCredits}</div>
              <div className="text-sm mt-2 text-[var(--secondary-color)] font-medium">
                of {requiredCredits} required
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center py-2 px-6 bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer text-sm font-medium h-fit"
            >
              Details
            </button>
          </div>
        </div>

        {/* Upcoming Deadlines Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center">
            <h3 className="text-[var(--secondary-color)] text-lg font-medium">Upcoming Deadlines</h3>
            <div className="flex items-center justify-center">
              <Clock className="h-6 w-6 text-[var(--glide-blue)]" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-4xl mt-3 font-bold text-[var(--primary-color)]">{upcomingDeadlines}</div>
              <div className="text-sm mt-2 text-red-500 font-medium">
                {dueThisWeek} due this week
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center py-2 px-6 bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer text-sm font-medium h-fit"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
