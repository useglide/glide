'use client';

import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  BookOpen,
  User,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { TodoItem as TodoItemType } from '../app/todo/page';

interface TodoItemProps {
  todo: TodoItemType;
  onToggleComplete: (todoId: string, completed: boolean) => void;
  onEdit: (todo: TodoItemType) => void;
  onDelete: (todoId: string) => void;
}

export function TodoItem({ todo, onToggleComplete, onEdit, onDelete }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = () => {
    onToggleComplete(todo.id, !todo.completed);
  };

  const handleEdit = () => {
    onEdit(todo);
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(todo.id);
      } catch (error) {
        console.error('Error deleting todo:', error);
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: 'Overdue', color: 'text-red-600', urgent: true };
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-orange-600', urgent: true };
      } else if (diffDays === 1) {
        return { text: 'Due tomorrow', color: 'text-yellow-600', urgent: false };
      } else if (diffDays <= 7) {
        return { text: `Due in ${diffDays} days`, color: 'text-blue-600', urgent: false };
      } else {
        return {
          text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          color: 'text-gray-600',
          urgent: false
        };
      }
    } catch {
      return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <BookOpen className="h-4 w-4" />;
      case 'custom':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const dueDateInfo = formatDate(todo.dueDate);

  return (
    <div className={`
      group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md
      ${todo.completed
        ? 'bg-gray-50 border-gray-200 opacity-75'
        : 'bg-white border-gray-200 hover:border-[var(--glide-blue-20)]'
      }
    `}>
      {/* Main content */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`
            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${todo.completed
              ? 'bg-[var(--glide-blue)] border-[var(--glide-blue)] text-white'
              : 'border-gray-300 hover:border-[var(--glide-blue)] hover:bg-[var(--glide-blue-10)]'
            }
          `}
        >
          {todo.completed && <Check className="h-3 w-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and type */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`
              font-medium text-sm leading-tight
              ${todo.completed
                ? 'line-through text-gray-500'
                : 'text-[var(--primary-color)]'
              }
            `}>
              {todo.title}
            </h3>

            {/* Actions - show on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-[var(--glide-blue)] transition-colors"
                title="Edit task"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete task"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Description */}
          {todo.description && (
            <p className={`
              text-xs mb-2 leading-relaxed
              ${todo.completed ? 'text-gray-400' : 'text-[var(--secondary-color)]'}
            `}>
              {todo.description}
            </p>
          )}

          {/* Meta information */}
          <div className="flex items-center gap-3 text-xs">
            {/* Type indicator */}
            <div className="flex items-center gap-1 text-gray-500">
              {getTypeIcon(todo.type)}
              <span className="capitalize">{todo.type}</span>
            </div>

            {/* Course name for assignments */}
            {todo.courseName && (
              <div className="flex items-center gap-1 text-gray-500">
                <span>{todo.courseName}</span>
              </div>
            )}

            {/* Priority */}
            {todo.priority && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                {todo.priority}
              </span>
            )}

            {/* Due date */}
            {dueDateInfo && (
              <div className={`flex items-center gap-1 ${dueDateInfo.color}`}>
                {dueDateInfo.urgent ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span className="font-medium">{dueDateInfo.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Urgent indicator */}
      {dueDateInfo?.urgent && !todo.completed && (
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r"></div>
      )}
    </div>
  );
}
