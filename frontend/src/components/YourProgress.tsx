'use client';

import React from 'react';
import { Clock, CheckCircle, SmileIcon } from 'lucide-react';

interface YourProgressProps {
  loading?: boolean;
  currentGPA?: number;
  previousGPA?: number;
  completedCredits?: number;
  requiredCredits?: number;
  upcomingDeadlines?: number;
  dueThisWeek?: number;
}

export function YourProgress({
  loading = false,
  currentGPA = 3.78,
  previousGPA = 3.75,
  completedCredits = 109,
  requiredCredits = 120,
  upcomingDeadlines = 5,
  dueThisWeek = 3
}: YourProgressProps) {
  // Calculate GPA change
  const gpaChange = currentGPA - previousGPA;
  const isGpaIncreased = gpaChange > 0;
  
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-[var(--white-grey)] p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
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
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="text-[var(--secondary-color)] font-medium">Current GPA</h3>
            <div className="w-8 h-8 flex items-center justify-center">
              <SmileIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-[var(--primary-color)]">{currentGPA.toFixed(2)}</div>
            <div className={`text-sm mt-1 ${isGpaIncreased ? 'text-green-500' : 'text-red-500'}`}>
              {isGpaIncreased ? '+' : ''}{gpaChange.toFixed(2)} from last semester
            </div>
          </div>
          <div className="mt-auto pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-center py-2 px-4 bg-[var(--glide-blue-20)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer text-sm font-medium"
            >
              Details
            </button>
          </div>
        </div>

        {/* Completed Credits Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="text-[var(--secondary-color)] font-medium">Completed Credits</h3>
            <div className="w-8 h-8 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[var(--glide-blue)]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-[var(--primary-color)]">{completedCredits}</div>
            <div className="text-sm mt-1 text-[var(--secondary-color)]">
              of {requiredCredits} required
            </div>
          </div>
          <div className="mt-auto pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-center py-2 px-4 bg-[var(--glide-blue-20)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer text-sm font-medium"
            >
              Details
            </button>
          </div>
        </div>

        {/* Upcoming Deadlines Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="text-[var(--secondary-color)] font-medium">Upcoming Deadlines</h3>
            <div className="w-8 h-8 flex items-center justify-center">
              <Clock className="h-6 w-6 text-[var(--glide-blue)]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-[var(--primary-color)]">{upcomingDeadlines}</div>
            <div className="text-sm mt-1 text-red-500">
              {dueThisWeek} due this week
            </div>
          </div>
          <div className="mt-auto pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-center py-2 px-4 bg-[var(--glide-blue-20)] text-[var(--glide-blue)] rounded-lg transition-colors cursor-pointer text-sm font-medium"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
