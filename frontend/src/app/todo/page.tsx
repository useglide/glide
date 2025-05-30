'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { TodoList } from '../../components/TodoList';
import { AddTodoModal } from '../../components/AddTodoModal';
import { getDetailedCourseData } from '../../services/api';
import { todoService } from '../../services/todoService';

// Define Auth context interface
interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  logout?: () => Promise<void>;
}


// Define the todo item interface
export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  type: 'assignment' | 'custom';
  assignmentId?: number;
  courseId?: number;
  courseName?: string;
  createdAt: string;
  updatedAt: string;
}

// Define assignment interface for Canvas data
interface Assignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible?: number | null;
  course_name?: string;
  course_code?: string;
  course_id?: number;
  submission?: {
    submitted_at?: string;
    score?: number;
    grade?: string;
    late?: boolean;
    missing?: boolean;
  };
}

// Define course interface
interface Course {
  id: number;
  name: string;
  course_code: string;
  term?: string;
  teachers?: Array<{
    id: number;
    display_name: string;
    avatar_image_url?: string;
  }>;
  grade?: number | null;
  grade_letter?: string | null;
}

// Define announcement interface
interface Announcement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  course_id: number;
  course_name?: string;
}

// Define timing interface
interface TimingInfo {
  totalTimeMs: number;
  totalTimeSec: string;
  formattedTime: string;
  sections: Record<string, unknown>;
}

// Define the API response interface for getDetailedCourseData
interface DetailedCourseDataResponse {
  status: string;
  courses: Course[];
  assignments: Assignment[];
  announcements: Announcement[];
  timing?: TimingInfo;
  error?: string;
}

export default function TodoPage() {
  const { user } = useAuth() as AuthContextType;
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load assignments from Canvas/API
  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const detailedData = await getDetailedCourseData() as DetailedCourseDataResponse;

        if (detailedData?.assignments) {
          setAssignments(detailedData.assignments);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
        setError('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [user]);

  const handleAddTodo = async (todoData: Omit<TodoItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;

    try {
      await todoService.addTodo({
        ...todoData,
        userId: user.uid,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Todo" />
      <div className="p-8 h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto h-full">

          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-8 h-full">
            {/* Left Half - Todo List */}
            <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[var(--primary-color)]">
                  Your Tasks
                </h2>
              </div>

              <TodoList
                todos={todos}
                setTodos={setTodos}
                assignments={assignments}
                loading={loading}
                error={error}
              />
            </div>

            {/* Right Half - Empty for now */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
              <div className="text-center text-[var(--secondary-color)]">
                <p className="text-lg font-medium mb-2">Coming Soon</p>
                <p className="text-sm">Additional features will be added here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Todo Modal */}
      <AddTodoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddTodo}
      />
    </div>
  );
}
