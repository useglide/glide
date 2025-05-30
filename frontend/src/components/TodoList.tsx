'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { todoService } from '../services/todoService';
import { TodoItem } from './TodoItem';
import { AddTodoModal } from './AddTodoModal';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import type { TodoItem as TodoItemType } from '../app/todo/page';

// Define Auth context interface
interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  logout?: () => Promise<void>;
}

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

interface TodoListProps {
  todos: TodoItemType[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItemType[]>>;
  assignments: Assignment[];
  loading: boolean;
  error: string;
}

export function TodoList({ todos, setTodos, assignments, loading, error }: TodoListProps) {
  const { user } = useAuth() as AuthContextType;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItemType | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Load todos from Firestore and set up real-time listener
  useEffect(() => {
    if (!user?.uid) return;

    setLocalLoading(true);

    // Set up real-time listener
    const unsubscribe = todoService.subscribeToUserTodos(user.uid, (updatedTodos: TodoItemType[]) => {
      setTodos(updatedTodos);
      setLocalLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, setTodos]);

  // Auto-sync assignments to todos
  useEffect(() => {
    const syncAssignments = async () => {
      if (!user?.uid || !assignments.length || syncing) return;

      try {
        setSyncing(true);
        await todoService.createTodosFromAssignments(user.uid, assignments);
      } catch (error) {
        console.error('Error syncing assignments:', error);
      } finally {
        setSyncing(false);
      }
    };

    // Only sync if we have assignments and todos are loaded
    if (assignments.length > 0 && !localLoading) {
      syncAssignments();
    }
  }, [user?.uid, assignments, localLoading, syncing]);

  const handleAddTodo = async (todoData: Omit<TodoItemType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
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

  const handleEditTodo = async (todoId: string, updates: Partial<TodoItemType>) => {
    try {
      await todoService.updateTodo(todoId, updates);
      setEditingTodo(null);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todoService.deleteTodo(todoId);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    try {
      await todoService.toggleTodoCompletion(todoId, completed);
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  };

  const handleManualSync = async () => {
    if (!user?.uid || syncing) return;

    try {
      setSyncing(true);
      await todoService.createTodosFromAssignments(user.uid, assignments);
    } catch (error) {
      console.error('Error syncing assignments:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Separate completed and pending todos
  const pendingTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  if (loading || localLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--glide-blue)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading todos: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-[var(--glide-blue-50)] transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        <div className="text-sm text-[var(--secondary-color)]">
          {pendingTodos.length} pending, {completedTodos.length} completed
        </div>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Pending todos */}
        {pendingTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleComplete={handleToggleComplete}
            onEdit={(todo) => setEditingTodo(todo)}
            onDelete={handleDeleteTodo}
          />
        ))}

        {/* Completed todos */}
        {completedTodos.length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-[var(--secondary-color)] mb-2">
                Completed ({completedTodos.length})
              </h3>
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(todo) => setEditingTodo(todo)}
                  onDelete={handleDeleteTodo}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {todos.length === 0 && (
          <div className="text-center py-8 text-[var(--secondary-color)]">
            <p className="text-lg font-medium mb-2">No tasks yet</p>
            <p className="text-sm">Add a task or sync your assignments to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddTodoModal
        open={isAddModalOpen || !!editingTodo}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingTodo(null);
          }
        }}
        todo={editingTodo}
        onSave={editingTodo ?
          (updates) => handleEditTodo(editingTodo.id, updates) :
          handleAddTodo
        }
      />
    </div>
  );
}
