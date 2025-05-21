'use client';

import React, { useState, useEffect } from 'react';
import { CheckIcon, PlusIcon, SearchIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  grade?: {
    score: number | null;
    letter: string | null;
    has_grade: boolean;
  };
}

interface CourseSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allCourses: Course[];
  currentCourses: Course[];
  onAddCourse: (courseId: number) => void;
  onRemoveCourse?: (courseId: number) => void;
  loading?: boolean;
}

export function CourseSelectionModal({
  open,
  onOpenChange,
  allCourses,
  currentCourses,
  onAddCourse,
  onRemoveCourse,
  loading = false,
}: CourseSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  // Filter courses based on search query
  useEffect(() => {
    if (!allCourses) return;

    if (searchQuery.trim() === '') {
      setFilteredCourses(allCourses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allCourses.filter(
        (course) =>
          course.name.toLowerCase().includes(query) ||
          course.course_code.toLowerCase().includes(query) ||
          (course.teachers &&
            course.teachers.some((teacher) =>
              teacher.display_name.toLowerCase().includes(query)
            ))
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, allCourses]);

  // Check if a course is already in current courses
  const isCourseSelected = (courseId: number) => {
    return currentCourses.some((course) => course.id === courseId);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle toggling a course (add or remove)
  const handleToggleCourse = (courseId: number, isSelected: boolean) => {
    if (isSelected) {
      // If already selected, remove it
      if (onRemoveCourse) {
        onRemoveCourse(courseId);
      }
    } else {
      // If not selected, add it
      onAddCourse(courseId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle>Manage Favorite Courses</DialogTitle>
          <DialogDescription>
            Select courses to add to or remove from your favorites. Current courses are automatically added as favorites unless you remove them.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search courses by name, code, or instructor"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Course list */}
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg animate-pulse border border-gray-200">
                  <div className="h-5 w-1/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No courses found matching your search.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredCourses.map((course) => {
                const isSelected = isCourseSelected(course.id);
                const primaryTeacher = course.teachers && course.teachers.length > 0
                  ? course.teachers[0].display_name
                  : null;

                return (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => handleToggleCourse(course.id, isSelected)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer",
                        isSelected
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        isSelected ? "bg-blue-500" : "bg-gray-200"
                      )}>
                        {isSelected ? (
                          <CheckIcon className="w-4 h-4 text-white" />
                        ) : (
                          <PlusIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            {course.course_code}
                          </span>
                          {course.grade?.score !== null && course.grade?.score !== undefined && (
                            <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                              {Math.round(course.grade.score)}%
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{course.name}</h4>
                        {primaryTeacher && (
                          <p className="text-sm text-gray-600">{primaryTeacher}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-md transition-colors cursor-pointer border border-gray-200"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
