'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { cn, darkenColor, isLightColor } from '@/lib/utils';

// Define the course interface
interface Course {
  id: number;
  name: string;
  course_code: string;
  displayName?: string;
  customColor?: string;
}

interface CourseSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  onSaveSettings: (courseId: number, displayName: string, customColor: string) => void;
  predefinedColors: string[];
}

export function CourseSettingsModal({
  open,
  onOpenChange,
  course,
  onSaveSettings,
  predefinedColors
}: CourseSettingsModalProps) {
  // State for the form inputs
  const [displayName, setDisplayName] = useState('');
  const [customColor, setCustomColor] = useState('');

  // Initialize form values when the modal opens
  useEffect(() => {
    if (open) {
      setDisplayName(course.displayName || course.name);
      setCustomColor(course.customColor || '');
    }
  }, [open, course]);

  // Handle saving the settings
  const handleSave = () => {
    onSaveSettings(course.id, displayName, customColor);
    onOpenChange(false);
  };

  // Get the CSS variable value for a predefined color
  const getColorValue = (colorClass: string) => {
    const colorVar = colorClass.replace('bg-[var(--', '').replace(')]', '');
    return `var(--${colorVar})`;
  };

  // Function to get appropriate text color for a background color
  const getColorForText = (bgColor: string): string => {
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
          return darkenColor(hexColor, 60);
        } else {
          // For dark backgrounds, return white
          return 'white';
        }
      }

      // If we don't have a mapping, make a best guess
      if (varName === 'course-indigo') {
        return 'white'; // It's dark, so use white
      } else if (varName.startsWith('course-')) {
        // Most course colors are light, so darken them
        return darkenColor('#E0E0FF', 60);
      }

      return '#1E293B'; // Default
    }

    // For hex colors
    if (bgColor.startsWith('#')) {
      if (isLightColor(bgColor)) {
        // For light backgrounds, return a darker, more vibrant shade of the same color
        return darkenColor(bgColor, 60);
      } else {
        // For dark backgrounds, return white
        return 'white';
      }
    }

    // Default
    return '#1E293B';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[var(--white-grey)]">
        <DialogHeader>
          <DialogTitle>Course Settings</DialogTitle>
          <DialogDescription>
            Customize how this course appears on your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="displayName" className="text-right text-sm font-medium">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={course.name}
            />
          </div>

          {/* Course Color Picker */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="customColor" className="text-right text-sm font-medium">
              Course Color
            </label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <input
                  id="customColor"
                  type="color"
                  value={customColor || getColorValue(predefinedColors[0])}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-10 w-16 rounded-md border border-input cursor-pointer"
                />
                <div
                  className="px-3 py-1 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: customColor || getColorValue(predefinedColors[0]),
                    color: getColorForText(customColor || getColorValue(predefinedColors[0]))
                  }}
                >
                  {customColor || getColorValue(predefinedColors[0])}
                </div>
              </div>
            </div>
          </div>

          {/* Favorite Colors */}
          <div className="grid grid-cols-4 items-start gap-4 mt-4">
            <div className="text-right text-sm font-medium pt-2">
              Favorite Colors
            </div>
            <div className="col-span-3">
                <div className="flex gap-3">
                  {predefinedColors.map((colorClass, index) => {
                    const colorValue = getColorValue(colorClass);
                    const isSelected = customColor === colorValue;
                    const checkColor = getColorForText(colorValue) === 'white' ? 'text-white' : 'text-[var(--primary-color)]';

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCustomColor(colorValue)}
                        className={cn(
                          "relative w-10 h-10 rounded-full border transition-all cursor-pointer",
                          colorClass,
                          isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "border-gray-300 hover:ring-1 hover:ring-blue-200"
                        )}
                        aria-label={`Select color`}
                      >
                        {isSelected && <Check className={`absolute inset-0 m-auto w-4 h-4 ${checkColor}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[var(--glide-blue)] text-[var(--text-light)] h-10 px-4 py-2 cursor-pointer"
          >
            Save Changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
