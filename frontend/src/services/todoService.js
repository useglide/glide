import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for managing todo items in Firestore
 */
export class TodoService {
  constructor() {
    this.collectionName = 'todos';
  }

  /**
   * Get all todos for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of todo items
   */
  async getUserTodos(userId) {
    try {
      const todosRef = collection(db, this.collectionName);
      let q;

      try {
        // Try with orderBy first
        q = query(
          todosRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } catch (indexError) {
        console.warn('Index not available, using simple query:', indexError);
        // Fallback to simple query without orderBy
        q = query(
          todosRef,
          where('userId', '==', userId)
        );
      }

      const querySnapshot = await getDocs(q);
      const todos = [];

      querySnapshot.forEach((doc) => {
        todos.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        });
      });

      // Sort manually if we couldn't use orderBy
      todos.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      return todos;
    } catch (error) {
      console.error('Error getting user todos:', error);
      throw error;
    }
  }

  /**
   * Add a new todo item
   * @param {Object} todoData - Todo item data
   * @returns {Promise<string>} Document ID of created todo
   */
  async addTodo(todoData) {
    try {
      const todosRef = collection(db, this.collectionName);
      const docRef = await addDoc(todosRef, {
        ...todoData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  }

  /**
   * Update an existing todo item
   * @param {string} todoId - Todo document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateTodo(todoId, updates) {
    try {
      const todoRef = doc(db, this.collectionName, todoId);
      await updateDoc(todoRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  /**
   * Delete a todo item
   * @param {string} todoId - Todo document ID
   * @returns {Promise<void>}
   */
  async deleteTodo(todoId) {
    try {
      const todoRef = doc(db, this.collectionName, todoId);
      await deleteDoc(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }

  /**
   * Toggle todo completion status
   * @param {string} todoId - Todo document ID
   * @param {boolean} completed - New completion status
   * @returns {Promise<void>}
   */
  async toggleTodoCompletion(todoId, completed) {
    try {
      await this.updateTodo(todoId, { completed });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for user todos
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserTodos(userId, callback) {
    try {
      const todosRef = collection(db, this.collectionName);
      let q;

      try {
        // Try with orderBy first
        q = query(
          todosRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } catch (indexError) {
        console.warn('Index not available for subscription, using simple query:', indexError);
        // Fallback to simple query without orderBy
        q = query(
          todosRef,
          where('userId', '==', userId)
        );
      }

      return onSnapshot(q, (querySnapshot) => {
        const todos = [];
        querySnapshot.forEach((doc) => {
          todos.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
          });
        });

        // Sort manually if we couldn't use orderBy
        todos.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        callback(todos);
      });
    } catch (error) {
      console.error('Error subscribing to todos:', error);
      throw error;
    }
  }

  /**
   * Create todo items from Canvas assignments
   * @param {string} userId - User ID
   * @param {Array} assignments - Array of Canvas assignments
   * @returns {Promise<Array>} Array of created todo IDs
   */
  async createTodosFromAssignments(userId, assignments) {
    try {
      const createdTodos = [];

      // Get existing assignment todos to avoid duplicates
      const existingTodos = await this.getUserTodos(userId);
      const existingAssignmentIds = new Set(
        existingTodos
          .filter(todo => todo.type === 'assignment' && todo.assignmentId)
          .map(todo => todo.assignmentId)
      );

      for (const assignment of assignments) {
        // Skip if already exists or if already submitted
        if (existingAssignmentIds.has(assignment.id) ||
            assignment.submission?.submitted_at) {
          continue;
        }

        // Only create todos for assignments with due dates in the future
        if (assignment.due_at) {
          const dueDate = new Date(assignment.due_at);
          const now = new Date();

          if (dueDate > now) {
            const todoData = {
              userId,
              title: assignment.name,
              description: `Assignment for ${assignment.course_name || assignment.course_code || 'Unknown Course'}`,
              completed: false,
              dueDate: assignment.due_at,
              priority: this.getAssignmentPriority(assignment.due_at),
              type: 'assignment',
              assignmentId: assignment.id,
              courseId: assignment.course_id,
              courseName: assignment.course_name || assignment.course_code,
            };

            const todoId = await this.addTodo(todoData);
            createdTodos.push(todoId);
          }
        }
      }

      return createdTodos;
    } catch (error) {
      console.error('Error creating todos from assignments:', error);
      throw error;
    }
  }

  /**
   * Determine assignment priority based on due date
   * @param {string} dueDate - Assignment due date
   * @returns {string} Priority level
   */
  getAssignmentPriority(dueDate) {
    if (!dueDate) return 'low';

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'high';
    if (diffDays <= 3) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const todoService = new TodoService();
