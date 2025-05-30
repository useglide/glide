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
  currentGPA: providedGPA,
  previousGPA,
  completedCredits,
  requiredCredits = 120,
  upcomingDeadlines = 0,
  dueThisWeek = 0,
  courses = []
}: YourProgressProps) {
  // Calculate GPA based on courses with grades
  const calculateGPA = () => {
    // Debug: Log the courses data to understand what we're working with
    console.log('YourProgress - Courses data:', courses);
    console.log('YourProgress - Courses with grade info:', courses.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      gradeType: typeof c.grade
    })));

    // Filter courses that have a grade (valid percentage between 0-100)
    const coursesWithGrades = courses.filter(course =>
      course.grade !== undefined &&
      course.grade !== null &&
      typeof course.grade === 'number' &&
      course.grade >= 0 &&
      course.grade <= 100
    );

    console.log('YourProgress - Courses with valid grades:', coursesWithGrades.length, coursesWithGrades);

    if (coursesWithGrades.length === 0) {
      return null; // Return null if no courses have grades
    }

    // Calculate total grade points and total courses
    const totalGradePoints = coursesWithGrades.reduce((sum, course) => {
      // Convert percentage to 4.0 scale using a more realistic conversion
      // A = 90-100% = 4.0, B = 80-89% = 3.0, C = 70-79% = 2.0, D = 60-69% = 1.0, F = 0-59% = 0.0
      let gradePoint = 0.0;
      const grade = course.grade!;

      if (grade >= 97) gradePoint = 4.0;
      else if (grade >= 93) gradePoint = 3.7;
      else if (grade >= 90) gradePoint = 3.3;
      else if (grade >= 87) gradePoint = 3.0;
      else if (grade >= 83) gradePoint = 2.7;
      else if (grade >= 80) gradePoint = 2.3;
      else if (grade >= 77) gradePoint = 2.0;
      else if (grade >= 73) gradePoint = 1.7;
      else if (grade >= 70) gradePoint = 1.3;
      else if (grade >= 67) gradePoint = 1.0;
      else if (grade >= 65) gradePoint = 0.7;
      else gradePoint = 0.0;

      return sum + gradePoint;
    }, 0);

    // Calculate GPA
    const finalGPA = totalGradePoints / coursesWithGrades.length;
    console.log('YourProgress - Calculated GPA:', finalGPA, 'from', coursesWithGrades.length, 'courses');
    return finalGPA;
  };

  // Get the calculated GPA
  const calculatedGPA = calculateGPA();

  // Use the calculated GPA or the provided GPA, or null if neither exists
  const currentGPA = calculatedGPA !== null ? calculatedGPA : providedGPA;

  console.log('YourProgress - Final GPA display:', { calculatedGPA, providedGPA, currentGPA });

  // Calculate GPA change (only if both current and previous GPA exist)
  const gpaChange = currentGPA !== null && currentGPA !== undefined && previousGPA !== null && previousGPA !== undefined
    ? currentGPA - previousGPA
    : null;

  // Calculate completed credits based on courses
  // Take the total number of courses and multiply by 3
  const calculatedCompletedCredits = courses.length * 3;

  // Debug: Log the credit calculation
  console.log('YourProgress - Credit calculation:', {
    coursesCount: courses.length,
    calculatedCredits: calculatedCompletedCredits,
    providedCredits: completedCredits
  });

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
              {currentGPA !== null && currentGPA !== undefined ? (
                <>
                  <div className="text-4xl mt-3 font-bold text-[var(--primary-color)]">{currentGPA.toFixed(2)}</div>
                  {gpaChange !== null && (
                    <div className={`text-sm mt-2 font-medium ${gpaChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {gpaChange >= 0 ? '+' : ''}{gpaChange.toFixed(1)} from last semester
                    </div>
                  )}
                  {gpaChange === null && (
                    <div className="text-sm mt-2 text-[var(--secondary-color)] font-medium">
                      No previous semester data
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-4xl mt-3 font-bold text-[var(--secondary-color)]">--</div>
                  <div className="text-sm mt-2 text-[var(--secondary-color)] font-medium">
                    No grades available
                  </div>
                </>
              )}
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
